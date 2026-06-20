"""
Repository layer for Order data access.
"""
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.order import Order


class OrderRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, order: Order) -> Order:
        self.session.add(order)
        self.session.commit()
        self.session.refresh(order)
        return order

    def get_by_id(self, order_id: int) -> Optional[Order]:
        stmt = select(Order).options(joinedload(Order.items)).where(Order.id == order_id)
        return self.session.execute(stmt).unique().scalar_one_or_none()

    def list(self, skip: int = 0, limit: int = 50, customer_id: Optional[int] = None) -> List[Order]:
        stmt = select(Order).options(joinedload(Order.items))
        if customer_id:
            stmt = stmt.where(Order.customer_id == customer_id)
        stmt = stmt.offset(skip).limit(limit).order_by(Order.id.desc())
        return list(self.session.execute(stmt).scalars().unique().all())

    def update(self, order: Order) -> Order:
        self.session.commit()
        self.session.refresh(order)
        return order

    def delete(self, order: Order) -> None:
        self.session.delete(order)
        self.session.commit()
