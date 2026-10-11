from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ExpenseBase(BaseModel):
    name: str
    category: str = "Other" # Ingredients, Packaging, Delivery, Electricity, Equipment, Marketing, Rent, Other
    amount: float
    expense_date: Optional[datetime] = None
    description: Optional[str] = None
    receipt_url: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
