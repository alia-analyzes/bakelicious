from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class Production(Base):
    __tablename__ = "production"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    production_date = Column(DateTime, nullable=False)
    delivery_date = Column(DateTime, nullable=False)
    status = Column(String, default="Not Started") # Not Started, Preparing, Baking, Decorating, Quality Check, Ready, Completed
    priority = Column(String, default="Normal") # Normal, High, Urgent
    notes = Column(Text, nullable=True)

    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    stage_updated_at = Column(DateTime, default=datetime.utcnow)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    order = relationship("Order", back_populates="production")
    assigned_baker = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_productions")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
