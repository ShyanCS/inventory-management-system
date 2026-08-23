"""
Repository layer for Product data access.
Pure CRUD, no business logic.
"""

from __future__ import annotations

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
        return self.session.get(Product, product_id)

    def get_by_sku(self, sku: str) -> Product | None:
        stmt = select(Product).where(Product.sku == sku)
        return self.session.execute(stmt).scalar_one_or_none()

    def _filtered_stmt(self, low_stock: bool = False):
        stmt = select(Product)
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
        """All matching products regardless of pagination, for CSV export."""
        stmt = self._filtered_stmt(low_stock).order_by(Product.id)
        return list(self.session.execute(stmt).scalars().all())

    def update(self, product: Product, product_in: ProductUpdate) -> Product:
        update_data = product_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(product, field, value)

        self.session.commit()
        self.session.refresh(product)
        return product

    def delete(self, product: Product) -> None:
        self.session.delete(product)
        self.session.commit()
