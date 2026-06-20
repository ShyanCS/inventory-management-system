"""
Models package — import all models here so Alembic and tests can discover them.
"""
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem

__all__ = ["Product", "Customer", "Order", "OrderItem"]
