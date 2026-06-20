"""
API router for Dashboard.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.dashboard import DashboardSummaryOut
from app.services.product_service import ProductService


router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryOut)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_products = db.execute(select(func.count(Product.id))).scalar() or 0
    total_customers = db.execute(select(func.count(Customer.id))).scalar() or 0
    total_orders = db.execute(select(func.count(Order.id))).scalar() or 0
    
    p_service = ProductService(db)
    low_stock_products = p_service.list_products(skip=0, limit=100, low_stock=True, threshold=10)
    
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": low_stock_products
    }
