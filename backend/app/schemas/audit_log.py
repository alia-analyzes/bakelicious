from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    username: Optional[str]
    action: str
    entity_type: str
    entity_id: Optional[str]
    details: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True
