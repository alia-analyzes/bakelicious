from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReceiptBase(BaseModel):
    customer_name: str
    phone_number: str
    customer_address: Optional[str] = None
    receipt_date: Optional[datetime] = None

    cake_flavour: Optional[str] = None
    cake_weight: Optional[str] = None
    delivery_date: Optional[str] = None
    delivery_time: Optional[str] = None
    order_type: str = "Self Pick-up"
    delivery_address: Optional[str] = None

    items_json: Optional[str] = None
    cake_amount: float = 0.0
    delivery_charges: float = 0.0

    candles_required: bool = False
    candle_type: Optional[str] = None
    candle_quantity: int = 0
    candle_price_per_unit: float = 0.0
    total_candle_charges: float = 0.0

    final_total: float = 0.0
    advance_paid: float = 0.0
    due_amount: float = 0.0

    notes: Optional[str] = None

class ReceiptCreate(ReceiptBase):
    receipt_number: Optional[str] = None

class ReceiptUpdate(ReceiptBase):
    # Notice: receipt_number is excluded or immutable on edit as required
    pass

class ReceiptResponse(ReceiptBase):
    id: int
    receipt_number: str
    receipt_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
