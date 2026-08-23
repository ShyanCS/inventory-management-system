"""
Service layer for Order business logic.
Handles atomic decrement, stock validation, total calculation, and restocking on cancellation.
"""

from datetime import date

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

            # Ensure all products exist
            for item in order_in.items:
                if item.product_id not in product_map:
                    raise NotFoundException(message=f"Product {item.product_id} not found")

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

            from decimal import Decimal

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
