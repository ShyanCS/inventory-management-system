"""
API router for Orders.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.order import OrderCreate, OrderOut
from app.services.order_service import OrderService


router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])


def get_order_service(db: Session = Depends(get_db)) -> OrderService:
    return OrderService(db)


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: OrderCreate,
    service: OrderService = Depends(get_order_service)
):
    return service.create_order(order_in)


@router.get("", response_model=List[OrderOut])
def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    customer_id: Optional[int] = Query(None),
    service: OrderService = Depends(get_order_service)
):
    return service.list_orders(skip=skip, limit=limit, customer_id=customer_id)


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    service: OrderService = Depends(get_order_service)
):
    return service.get_order(order_id)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_order(
    order_id: int,
    service: OrderService = Depends(get_order_service)
):
    # Cancelling restores stock, but doesn't hard-delete.
    # Status code 204 means no content, which is requested by the spec "200/204".
    service.cancel_order(order_id)
