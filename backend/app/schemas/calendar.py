from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class CalendarEventResponse(BaseModel):
    id: str
    event_type: str  # NEW_ORDER, MAKING, READY, DELIVERY, DELIVERED, LATE, STOCK, NOTE
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    all_day: bool = True
    status: Optional[str] = None
    priority: Optional[str] = "Normal"
    color: str
    related_entity_type: str  # ORDER, PRODUCTION, INVENTORY_TRANSACTION, CALENDAR_NOTE
    related_entity_id: int
    details: Dict[str, Any] = {}

    class Config:
        from_attributes = True

class CalendarSummaryResponse(BaseModel):
    new_orders_today: int = 0
    making_today: int = 0
    ready_today: int = 0
    deliveries_scheduled_today: int = 0
    deliveries_completed_today: int = 0
    late_overdue_today: int = 0
    stock_updates_today: int = 0
    notes_today: int = 0

class CalendarNoteCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    all_day: bool = True
    priority: Optional[str] = "Normal"
    color: Optional[str] = "#8B5CF6"

class CalendarNoteUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    all_day: Optional[bool] = None
    priority: Optional[str] = None
    color: Optional[str] = None
    is_completed: Optional[bool] = None

class CalendarNoteResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    start_datetime: datetime
    end_datetime: Optional[datetime]
    all_day: bool
    priority: str
    color: str
    is_completed: bool
    created_by_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CalendarRescheduleRequest(BaseModel):
    entity_type: str  # ORDER_DELIVERY, PRODUCTION, CALENDAR_NOTE
    entity_id: int
    new_start_datetime: datetime
    new_end_datetime: Optional[datetime] = None
