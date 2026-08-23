"""
Service layer for Order business logic.
Handles atomic decrement, stock validation, total calculation, and restocking on cancellation.
"""

import csv
from datetime import date
from decimal import Decimal
from io import StringIO

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import (
    ConflictException,
    NotFoundException,
    UnprocessableException,
)
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.repositories.order_repository import OrderRepository
from app.schemas.order import OrderCreate

ORDER_CSV_HEADERS = [
    "order_id",
    "status",
    "customer_name",
    "created_at",
    "item_id",
    "product_sku",
    "item_quantity",
    "unit_price",
    "item_subtotal",
    "order_total",
]


class OrderService:
    def __init__(self, session: Session):
        self.session = session
        self.repo = OrderRepository(session)

    def create_order(self, order_in: OrderCreate) -> Order:
        # Validate customer
        customer = self.session.get(Customer, order_in.customer_id)
        if not customer:
            raise NotFoundException(message=f"Customer {order_in.customer_id} not found")

        # Get all requested product IDs
        product_ids = [item.product_id for item in order_in.items]

        try:
            # We must lock the rows we are updating to prevent race conditions.
            # with_for_update() locks the rows in the database until the end of the transaction.
            stmt = select(Product).where(Product.id.in_(product_ids)).with_for_update()
            products = self.session.execute(stmt).scalars().all()

            product_map = {p.id: p for p in products}

            # Ensure all products exist and are not soft-deleted
            for item in order_in.items:
                if item.product_id not in product_map:
                    raise NotFoundException(message=f"Product {item.product_id} not found")
                if product_map[item.product_id].is_deleted:
                    raise ConflictException(
                        message=f"Product {item.product_id} is no longer available",
                        details={"product_id": item.product_id},
                    )

            # Validate stock for all items BEFORE decrementing anything (Rule 4)
            for item in order_in.items:
                product = product_map[item.product_id]
                if item.quantity > product.quantity_in_stock:
                    raise ConflictException(
                        message=(
                            f"Insufficient stock for {product.name} (SKU {product.sku}). "
                            f"Requested {item.quantity}, available {product.quantity_in_stock}."
                        ),
                        details={
                            "product_id": product.id,
                            "requested": item.quantity,
                            "available": product.quantity_in_stock,
                        },
                    )

            # Create Order
            new_order = Order(
                customer_id=order_in.customer_id, status="pending", total_amount=Decimal("0.0")
            )

            total_amount = Decimal("0.0")
            order_items = []

            # Decrement stock and calculate totals (Rules 5, 7, 8)
            for item in order_in.items:
                product = product_map[item.product_id]

                # Rule 8: Snapshot price
                unit_price = Decimal(str(product.price))
                subtotal = unit_price * Decimal(str(item.quantity))
                total_amount += subtotal

                # Rule 5: Decrement stock
                product.quantity_in_stock -= item.quantity

                order_item = OrderItem(
                    product_id=product.id,
                    quantity=item.quantity,
                    unit_price=unit_price,
                    subtotal=subtotal,
                )
                order_items.append(order_item)

            new_order.total_amount = total_amount
            new_order.items = order_items

            # Save
            return self.repo.create(new_order)

        except Exception as e:
            raise e

    def get_order(self, order_id: int) -> Order:
        order = self.repo.get_by_id(order_id)
        if not order:
            raise NotFoundException(message=f"Order {order_id} not found")
        return order

    def list_orders(
        self,
        skip: int = 0,
        limit: int = 50,
        customer_id: int | None = None,
        status: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        q: str | None = None,
    ) -> tuple[list[Order], int]:
        if date_from and date_to and date_to < date_from:
            raise UnprocessableException(message="date_to must be on or after date_from")
        filters = {
            "customer_id": customer_id,
            "status": status,
            "date_from": date_from,
            "date_to": date_to,
            "q": q,
        }
        return self.repo.list(skip=skip, limit=limit, **filters), self.repo.count(**filters)

    def export_csv(
        self,
        status: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> str:
        """Render all matching orders as flat CSV text, one row per line item
        (ignores pagination; search is not supported for exports)."""
        if date_from and date_to and date_to < date_from:
            raise UnprocessableException(message="date_to must be on or after date_from")

        orders = self.repo.list_for_export(status=status, date_from=date_from, date_to=date_to)

        buffer = StringIO()
        writer = csv.writer(buffer)
        writer.writerow(ORDER_CSV_HEADERS)
        for order in orders:
            customer_name = order.customer.full_name if order.customer else ""
            for item in sorted(order.items, key=lambda i: i.id):
                writer.writerow(
                    [
                        order.id,
                        order.status,
                        customer_name,
                        order.created_at.isoformat(),
                        item.id,
                        item.product.sku if item.product else "",
                        item.quantity,
                        f"{item.unit_price:.2f}",
                        f"{item.subtotal:.2f}",
                        f"{order.total_amount:.2f}",
                    ]
                )
        return buffer.getvalue()

    def cancel_order(self, order_id: int) -> Order:
        order = self.get_order(order_id)

        if order.status == "cancelled":
            raise ConflictException(message="Order is already cancelled")

        try:
            # We need to lock the products to restock them safely
            product_ids = [item.product_id for item in order.items]
            stmt = select(Product).where(Product.id.in_(product_ids)).with_for_update()
            products = self.session.execute(stmt).scalars().all()
            product_map = {p.id: p for p in products}

            # Restock
            for item in order.items:
                product = product_map.get(item.product_id)
                if product:
                    product.quantity_in_stock += item.quantity

            order.status = "cancelled"
            return self.repo.update(order)

        except Exception as e:
            raise e
