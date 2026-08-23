"""
Models package — import all models here so Alembic and tests can discover them.
"""

from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.product import Product

__all__ = ["Product", "Customer", "Order", "OrderItem"]
