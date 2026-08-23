"""
Product Pydantic schemas.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(..., max_length=200)
    sku: str = Field(..., max_length=50)
    price: float = Field(..., gt=0)
    quantity_in_stock: int = Field(default=0, ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(None, max_length=200)
    sku: str | None = Field(None, max_length=50)
    price: float | None = Field(None, gt=0)
    quantity_in_stock: int | None = Field(None, ge=0)


class ProductOut(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
