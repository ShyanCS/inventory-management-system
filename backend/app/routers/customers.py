"""
API router for Customers.
"""
from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.customer import CustomerCreate, CustomerOut
from app.services.customer_service import CustomerService


router = APIRouter(prefix="/api/v1/customers", tags=["Customers"])


def get_customer_service(db: Session = Depends(get_db)) -> CustomerService:
    return CustomerService(db)


@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer_in: CustomerCreate,
    service: CustomerService = Depends(get_customer_service)
):
    return service.create_customer(customer_in)


@router.get("", response_model=List[CustomerOut])
def list_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    service: CustomerService = Depends(get_customer_service)
):
    return service.list_customers(skip=skip, limit=limit)


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(
    customer_id: int,
    service: CustomerService = Depends(get_customer_service)
):
    return service.get_customer(customer_id)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    service: CustomerService = Depends(get_customer_service)
):
    service.delete_customer(customer_id)
