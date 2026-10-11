from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from app.schemas.order import OrderResponse

class ProductionStatusUpdate(BaseModel):
    status: str # Not Started, Preparing, Baking, Decorating, Quality Check, Ready, Completed
    notes: Optional[str] = None

class ProductionAssignPayload(BaseModel):
    assigned_to_id: Optional[int] = None
    priority: Optional[str] = "Normal" # Normal, High, Urgent
    notes: Optional[str] = None

class BakerMinimalResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    email: str

    class Config:
        from_attributes = True

class ProductionResponse(BaseModel):
    id: int
    order_id: int
    production_date: datetime
    delivery_date: datetime
    status: str
    priority: Optional[str] = "Normal"
    notes: Optional[str] = None
    assigned_to_id: Optional[int] = None
    assigned_by_id: Optional[int] = None
    assigned_at: Optional[datetime] = None
    stage_updated_at: Optional[datetime] = None
    assigned_baker: Optional[BakerMinimalResponse] = None
    order: Optional[OrderResponse] = None
    updated_at: datetime

    class Config:
        from_attributes = True
