"""
Customer SQLAlchemy model.

Matches spec section 4.2 exactly:
  - id: SERIAL primary key
  - full_name: VARCHAR(150), NOT NULL
  - email: VARCHAR(255), NOT NULL, UNIQUE, indexed
  - phone: VARCHAR(30), NOT NULL
  - created_at: TIMESTAMPTZ, NOT NULL, auto-set
  - updated_at: TIMESTAMPTZ, NOT NULL, auto-updated
"""
from datetime import datetime, timezone

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationship — an customer has many orders
    orders = relationship("Order", back_populates="customer")

    def __repr__(self) -> str:
        return f"<Customer(id={self.id}, email='{self.email}')>"
