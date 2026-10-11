from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FeedbackBase(BaseModel):
    customer_name: str
    rating: int = 5
    review_text: Optional[str] = None
    image_url: Optional[str] = None
    is_screenshot: bool = False
    is_published: bool = True

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackUpdate(BaseModel):
    customer_name: Optional[str] = None
    rating: Optional[int] = None
    review_text: Optional[str] = None
    image_url: Optional[str] = None
    is_screenshot: Optional[bool] = None
    is_published: Optional[bool] = None

class FeedbackResponse(FeedbackBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
