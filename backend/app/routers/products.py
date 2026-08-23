"""
API router for Products.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.common import Page
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate
from app.services.product_service import ProductService

router = APIRouter(prefix="/api/v1/products", tags=["Products"])


def get_product_service(db: Session = Depends(get_db)) -> ProductService:
    return ProductService(db)


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate, service: ProductService = Depends(get_product_service)
):
    return service.create_product(product_in)


@router.get("", response_model=Page[ProductOut])
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    low_stock: bool = Query(False),
    service: ProductService = Depends(get_product_service),
):
    items, total = service.list_products(skip=skip, limit=limit, low_stock=low_stock)
    return Page(items=items, total=total, skip=skip, limit=limit)


# NOTE: declared before /{product_id} so "export" is not parsed as an id
@router.get("/export")
def export_products(
    low_stock: bool = Query(False),
    service: ProductService = Depends(get_product_service),
):
    csv_text = service.export_csv(low_stock=low_stock)
    timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M")
    return Response(
        content=csv_text,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="products_{timestamp}.csv"'},
    )


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, service: ProductService = Depends(get_product_service)):
    return service.get_product(product_id)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    service: ProductService = Depends(get_product_service),
):
    return service.update_product(product_id, product_in)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, service: ProductService = Depends(get_product_service)):
    service.delete_product(product_id)
