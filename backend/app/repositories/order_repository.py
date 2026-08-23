"""
Repository layer for Order data access.
"""

from datetime import date

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.customer import Customer
from app.models.order import Order


class OrderRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, order: Order) -> Order:
        self.session.add(order)
        self.session.commit()
        self.session.refresh(order)
        return order

    def get_by_id(self, order_id: int) -> Order | None:
        stmt = select(Order).options(joinedload(Order.items)).where(Order.id == order_id)
        return self.session.execute(stmt).unique().scalar_one_or_none()

    def list(
        self,
        skip: int = 0,
        limit: int = 50,
        customer_id: int | None = None,
        status: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        q: str | None = None,
    ) -> list[Order]:
        stmt = select(Order).options(joinedload(Order.items))
        if customer_id:
            stmt = stmt.where(Order.customer_id == customer_id)
        if status:
            stmt = stmt.where(Order.status == status)
        if date_from:
            stmt = stmt.where(func.date(Order.created_at) >= date_from)
        if date_to:
            stmt = stmt.where(func.date(Order.created_at) <= date_to)
        if q and q.strip():
            term = q.strip().lstrip("#")
            conditions = [Customer.full_name.ilike(f"%{q.strip()}%")]
            if term.isdigit():
                conditions.append(Order.id == int(term))
            stmt = stmt.join(Order.customer).where(or_(*conditions))
        stmt = stmt.offset(skip).limit(limit).order_by(Order.id.desc())
        return list(self.session.execute(stmt).scalars().unique().all())

    def update(self, order: Order) -> Order:
        self.session.commit()
        self.session.refresh(order)
        return order

    def delete(self, order: Order) -> None:
        self.session.delete(order)
        self.session.commit()
