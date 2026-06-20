"""
Repository layer for Customer data access.
"""
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate


class CustomerRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, customer_in: CustomerCreate) -> Customer:
        customer = Customer(**customer_in.model_dump())
        self.session.add(customer)
        self.session.commit()
        self.session.refresh(customer)
        return customer

    def get_by_id(self, customer_id: int) -> Optional[Customer]:
        return self.session.get(Customer, customer_id)

    def get_by_email(self, email: str) -> Optional[Customer]:
        stmt = select(Customer).where(Customer.email == email)
        return self.session.execute(stmt).scalar_one_or_none()

    def list(self, skip: int = 0, limit: int = 50) -> List[Customer]:
        stmt = select(Customer).offset(skip).limit(limit).order_by(Customer.id.desc())
        return list(self.session.execute(stmt).scalars().all())

    def delete(self, customer: Customer) -> None:
        self.session.delete(customer)
        self.session.commit()
