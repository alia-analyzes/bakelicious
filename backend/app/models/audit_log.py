from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from datetime import datetime
from app.database.connection import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True) # actor_user_id
    username = Column(String, nullable=True)
    action = Column(String, nullable=False, index=True) # e.g. USER_CREATE, USER_ROLE_ASSIGN, PRODUCTION_ASSIGN
    entity_type = Column(String, nullable=False, index=True) # User, Role, Product, Order, Production, etc.
    entity_id = Column(String, nullable=True)
    details = Column(JSON, nullable=True) # general details
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
