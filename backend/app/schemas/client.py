from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ClientBase(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class ClientResponse(ClientBase):
    id: int
    total_orders: Optional[int] = 0
    total_spending: Optional[float] = 0.0
    last_order_date: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
