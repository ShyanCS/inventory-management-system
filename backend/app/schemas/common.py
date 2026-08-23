"""
Shared Pydantic schemas.
"""

from pydantic import BaseModel


class Page[T](BaseModel):
    """Paginated response envelope used by all list endpoints."""

    items: list[T]
    total: int
    skip: int
    limit: int
