from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from datetime import datetime
from app.database.connection import Base

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    rating = Column(Integer, default=5) # 1 to 5 stars
    review_text = Column(Text, nullable=True)
    image_url = Column(String, nullable=True) # WhatsApp screenshot / Instagram review image
    is_screenshot = Column(Boolean, default=False) # True if screenshot review, False if text review
    is_published = Column(Boolean, default=True) # Public visibility toggle
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
