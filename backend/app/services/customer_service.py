"""
Service layer for Customer business logic.
"""
from typing import List

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import ConflictException, NotFoundException
from app.models.customer import Customer
from app.repositories.customer_repository import CustomerRepository
from app.schemas.customer import CustomerCreate


class CustomerService:
    def __init__(self, session: Session):
        self.session = session
        self.repo = CustomerRepository(session)

    def _check_email_exists(self, email: str) -> None:
        if self.repo.get_by_email(email):
            raise ConflictException(
                message=f"Customer with email '{email}' already exists",
                details={"email": email}
            )

    def create_customer(self, customer_in: CustomerCreate) -> Customer:
        self._check_email_exists(customer_in.email)
        try:
            return self.repo.create(customer_in)
        except IntegrityError as e:
            self.session.rollback()
            if "email" in str(e).lower() or "unique" in str(e).lower():
                raise ConflictException(message="Customer email already exists", details={"email": customer_in.email})
            raise e

    def get_customer(self, customer_id: int) -> Customer:
        customer = self.repo.get_by_id(customer_id)
        if not customer:
            raise NotFoundException(message=f"Customer with ID {customer_id} not found")
        return customer

    def list_customers(self, skip: int = 0, limit: int = 50) -> List[Customer]:
        return self.repo.list(skip=skip, limit=limit)

    def delete_customer(self, customer_id: int) -> None:
        customer = self.get_customer(customer_id)
        try:
            self.repo.delete(customer)
        except IntegrityError as e:
            self.session.rollback()
            # If referenced by an order
            raise ConflictException(
                message="Cannot delete customer because they have existing orders."
            )
