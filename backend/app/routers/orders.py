"""
API router for Orders.
"""

from datetime import UTC, date, datetime
from typing import Literal

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.common import Page
from app.schemas.order import OrderCreate, OrderOut
from app.services.order_service import OrderService

router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])

OrderStatus = Literal["pending", "completed", "cancelled"]


def get_order_service(db: Session = Depends(get_db)) -> OrderService:
    return OrderService(db)


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate, service: OrderService = Depends(get_order_service)):
    return service.create_order(order_in)


@router.get("", response_model=Page[OrderOut])
def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    customer_id: int | None = Query(None),
    order_status: OrderStatus | None = Query(None, alias="status"),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    q: str | None = Query(None, max_length=100),
    service: OrderService = Depends(get_order_service),
):
    items, total = service.list_orders(
        skip=skip,
        limit=limit,
        customer_id=customer_id,
        status=order_status,
        date_from=date_from,
        date_to=date_to,
        q=q,
    )
    return Page(items=items, total=total, skip=skip, limit=limit)


# NOTE: declared before /{order_id} so "export" is not parsed as an id
@router.get("/export")
def export_orders(
    order_status: OrderStatus | None = Query(None, alias="status"),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    service: OrderService = Depends(get_order_service),
):
    csv_text = service.export_csv(status=order_status, date_from=date_from, date_to=date_to)
    timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M")
    return Response(
        content=csv_text,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="orders_{timestamp}.csv"'},
    )


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, service: OrderService = Depends(get_order_service)):
    return service.get_order(order_id)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_order(order_id: int, service: OrderService = Depends(get_order_service)):
    # Cancelling restores stock, but doesn't hard-delete.
    # Status code 204 means no content, which is requested by the spec "200/204".
    service.cancel_order(order_id)
