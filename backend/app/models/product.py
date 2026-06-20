"""
Product SQLAlchemy model.

Matches spec section 4.1 exactly:
  - id: SERIAL primary key
  - name: VARCHAR(200), NOT NULL
  - sku: VARCHAR(50), NOT NULL, UNIQUE, indexed
  - price: NUMERIC(10,2), NOT NULL, CHECK (price > 0)
  - quantity_in_stock: INTEGER, NOT NULL, DEFAULT 0, CHECK (>= 0)
  - created_at: TIMESTAMPTZ, NOT NULL, auto-set
  - updated_at: TIMESTAMPTZ, NOT NULL, auto-updated
"""
from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, Integer, Numeric, String, event
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    sku: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    quantity_in_stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        CheckConstraint("price > 0", name="ck_products_price_positive"),
        CheckConstraint("quantity_in_stock >= 0", name="ck_products_stock_non_negative"),
    )

    def __repr__(self) -> str:
        return f"<Product(id={self.id}, sku='{self.sku}', name='{self.name}')>"
