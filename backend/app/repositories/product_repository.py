"""
Repository layer for Product data access.
Pure CRUD, no business logic.

Soft delete: every read path filters out deleted rows via _active_stmt();
SKU uniqueness checks use get_by_sku() which intentionally includes
deleted rows so SKUs of tombstoned products stay reserved.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, product_in: ProductCreate) -> Product:
        product = Product(**product_in.model_dump())
        self.session.add(product)
        self.session.commit()
        self.session.refresh(product)
        return product

    def get_by_id(self, product_id: int) -> Product | None:
        """Active (non-deleted) product by id."""
        stmt = select(Product).where(Product.id == product_id, Product.deleted_at.is_(None))
        return self.session.execute(stmt).scalar_one_or_none()

    def get_any_by_id(self, product_id: int) -> Product | None:
        """Product by id including soft-deleted rows (for restore)."""
        return self.session.get(Product, product_id)

    def get_by_sku(self, sku: str) -> Product | None:
        # Includes deleted products: their SKUs stay reserved.
        stmt = select(Product).where(Product.sku == sku)
        return self.session.execute(stmt).scalar_one_or_none()

    def _active_stmt(self):
        return select(Product).where(Product.deleted_at.is_(None))

    def _filtered_stmt(self, low_stock: bool = False):
        stmt = self._active_stmt()
        if low_stock:
            stmt = stmt.where(Product.quantity_in_stock <= Product.low_stock_threshold)
        return stmt

    def list(self, skip: int = 0, limit: int = 50, low_stock: bool = False) -> list[Product]:
        stmt = self._filtered_stmt(low_stock).offset(skip).limit(limit).order_by(Product.id.desc())
        return list(self.session.execute(stmt).scalars().all())

    def count(self, low_stock: bool = False) -> int:
        stmt = select(func.count()).select_from(self._filtered_stmt(low_stock).subquery())
        return self.session.execute(stmt).scalar_one()

    def list_for_export(self, low_stock: bool = False) -> list[Product]:
        """All matching active products regardless of pagination, for CSV export."""
        stmt = self._filtered_stmt(low_stock).order_by(Product.id)
        return list(self.session.execute(stmt).scalars().all())

    def update(self, product: Product, product_in: ProductUpdate) -> Product:
        update_data = product_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(product, field, value)

        self.session.commit()
        self.session.refresh(product)
        return product

    def soft_delete(self, product: Product) -> None:
        product.deleted_at = datetime.now(UTC)
        self.session.commit()
        self.session.refresh(product)

    def restore(self, product: Product) -> None:
        product.deleted_at = None
        self.session.commit()
        self.session.refresh(product)
