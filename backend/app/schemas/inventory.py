from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.ingredient import IngredientResponse

class StockAdjustmentCreate(BaseModel):
    ingredient_id: int
    type: str # PURCHASE, PRODUCTION_CONSUMPTION, ADJUSTMENT, WASTAGE, RETURN
    quantity_change: float
    unit_cost_at_time: Optional[float] = None
    notes: Optional[str] = None

class InventoryTransactionResponse(BaseModel):
    id: int
    ingredient_id: int
    type: str
    quantity_change: float
    unit_cost_at_time: Optional[float]
    reference_id: Optional[str]
    notes: Optional[str]
    created_at: datetime
    ingredient: Optional[IngredientResponse] = None

    class Config:
        from_attributes = True
