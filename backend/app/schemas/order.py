from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.client import ClientResponse
from app.schemas.product import ProductResponse

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = 1
    size_override: Optional[str] = None
    unit_price: Optional[float] = None
    notes: Optional[str] = None

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    size_override: Optional[str] = None
    unit_price: float
    subtotal: float
    notes: Optional[str] = None
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    client_id: int
    delivery_date: datetime
    delivery_time: Optional[str] = "12:00 PM"
    production_date: Optional[datetime] = None
    items: List[OrderItemCreate]
    discount: float = 0.0
    advance_paid: float = 0.0
    special_instructions: Optional[str] = None
    delivery_address: Optional[str] = None
    notes: Optional[str] = None

class PublicOrderCreate(BaseModel):
    customer_name: str
    phone: str
    email: Optional[str] = None
    product_id: Optional[int] = None
    size_override: Optional[str] = None
    quantity: int = 1
    delivery_date: Optional[str] = None
    special_instructions: Optional[str] = None
    delivery_address: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    order_status: Optional[str] = None
    payment_status: Optional[str] = None
    advance_paid: Optional[float] = None

class OrderResponse(BaseModel):
    id: int
    order_number: str
    client_id: int
    order_date: datetime
    delivery_date: datetime
    delivery_time: Optional[str]
    production_date: Optional[datetime]
    
    subtotal: float
    discount: float
    final_amount: float
    advance_paid: float
    remaining_paid: float
    
    payment_status: str
    order_status: str
    special_instructions: Optional[str]
    delivery_address: Optional[str]
    notes: Optional[str]
    inventory_deducted: bool
    
    client: Optional[ClientResponse] = None
    items: List[OrderItemResponse] = []
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
