"""
Dashboard Pydantic schemas.
"""
from typing import List

from pydantic import BaseModel
from app.schemas.product import ProductOut


class DashboardSummaryOut(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: List[ProductOut]
