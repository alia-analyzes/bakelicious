from pydantic import BaseModel
from typing import Dict, Any

class SettingUpdate(BaseModel):
    key: str
    value: Any

class SettingResponse(BaseModel):
    id: int
    key: str
    value: Any

    class Config:
        from_attributes = True
