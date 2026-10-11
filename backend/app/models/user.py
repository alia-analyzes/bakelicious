from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_superadmin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    force_password_change = Column(Boolean, default=False, nullable=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    permission_overrides = relationship("UserPermissionOverride", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    assigned_productions = relationship("Production", foreign_keys="Production.assigned_to_id", back_populates="assigned_baker")

    @property
    def role(self) -> str:
        """Helper property for backward compatibility and display."""
        if self.is_superadmin:
            return "Super Admin"
        if self.user_roles and len(self.user_roles) > 0 and self.user_roles[0].role:
            return self.user_roles[0].role.name
        return "Staff"

    @property
    def roles_list(self) -> list:
        return [ur.role.name for ur in self.user_roles if ur.role]
