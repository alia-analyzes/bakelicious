from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class CalendarNote(Base):
    __tablename__ = "calendar_notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    start_datetime = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    end_datetime = Column(DateTime, nullable=True)
    all_day = Column(Boolean, default=True)
    priority = Column(String(20), default="Normal")  # Normal, High, Urgent
    color = Column(String(30), default="#8B5CF6")    # Purple default
    is_completed = Column(Boolean, default=False)
    
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])
