"""
Service layer for Product business logic.
"""

import csv
from io import StringIO

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictException, NotFoundException
from app.models.product import Product
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate

CSV_HEADERS = [
    "id",
    "name",
    "sku",
    "price",
    "quantity_in_stock",
    "low_stock_threshold",
    "created_at",
]


class ProductService:
    def __init__(self, session: Session):
        self.session = session
        self.repo = ProductRepository(session)

    def _check_sku_exists(self, sku: str) -> None:
        if self.repo.get_by_sku(sku):
            raise ConflictException(
                message=f"Product with SKU '{sku}' already exists", details={"sku": sku}
            )

    def create_product(self, product_in: ProductCreate) -> Product:
        self._check_sku_exists(product_in.sku)
        try:
            return self.repo.create(product_in)
        except IntegrityError as e:
            self.session.rollback()
            # Fallback if constraint was caught at DB level instead of service level
            if "sku" in str(e).lower() or "unique" in str(e).lower():
                raise ConflictException(
                    message="Product SKU already exists", details={"sku": product_in.sku}
                ) from e
            raise e

    def get_product(self, product_id: int) -> Product:
        product = self.repo.get_by_id(product_id)
        if not product:
            raise NotFoundException(message=f"Product with ID {product_id} not found")
        return product

    def list_products(
        self, skip: int = 0, limit: int = 50, low_stock: bool = False
    ) -> tuple[list[Product], int]:
        return (
            self.repo.list(skip=skip, limit=limit, low_stock=low_stock),
            self.repo.count(low_stock=low_stock),
        )

    def export_csv(self, low_stock: bool = False) -> str:
        """Render all matching products as CSV text (ignores pagination)."""
        buffer = StringIO()
        writer = csv.writer(buffer)
        writer.writerow(CSV_HEADERS)
        for product in self.repo.list_for_export(low_stock=low_stock):
            writer.writerow(
                [
                    product.id,
                    product.name,
                    product.sku,
                    f"{product.price:.2f}",
                    product.quantity_in_stock,
                    product.low_stock_threshold,
                    product.created_at.isoformat(),
                ]
            )
        return buffer.getvalue()

    def update_product(self, product_id: int, product_in: ProductUpdate) -> Product:
        product = self.get_product(product_id)

        if product_in.sku and product_in.sku != product.sku:
            self._check_sku_exists(product_in.sku)

        try:
            return self.repo.update(product, product_in)
        except IntegrityError as e:
            self.session.rollback()
            if "sku" in str(e).lower() or "unique" in str(e).lower():
                raise ConflictException(
                    message="Product SKU already exists", details={"sku": product_in.sku}
                ) from e
            raise e

    def delete_product(self, product_id: int) -> None:
        """Soft delete: the row keeps referential integrity but disappears
        from every read path. Its SKU stays reserved."""
        product = self.get_product(product_id)
        self.repo.soft_delete(product)

    def restore_product(self, product_id: int) -> Product:
        """Restore a soft-deleted product. SKU uniqueness is enforced globally
        by a unique constraint, so a tombstoned SKU can never have been taken."""
        product = self.repo.get_any_by_id(product_id)
        if not product:
            raise NotFoundException(message=f"Product with ID {product_id} not found")
        if not product.is_deleted:
            return product

        self.repo.restore(product)
        return product
