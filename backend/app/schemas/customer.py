"""
Customer Pydantic schemas.
"""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerBase(BaseModel):
    full_name: str = Field(..., max_length=150)
    email: EmailStr = Field(..., max_length=255)
    phone: str = Field(..., max_length=30)


class CustomerCreate(CustomerBase):
    pass


class CustomerOut(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
