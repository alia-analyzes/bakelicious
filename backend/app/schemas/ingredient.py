from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class IngredientBase(BaseModel):
    name: str
    category: Optional[str] = "General"
    quantity: float = 0.0
    unit: str = "kg"
    min_stock: float = 5.0
    unit_cost: float = 0.0
    supplier: Optional[str] = None

class IngredientCreate(IngredientBase):
    pass

class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    min_stock: Optional[float] = None
    unit_cost: Optional[float] = None
    supplier: Optional[str] = None

class IngredientResponse(IngredientBase):
    id: int
    is_low_stock: Optional[bool] = False
    updated_at: datetime

    class Config:
        from_attributes = True
