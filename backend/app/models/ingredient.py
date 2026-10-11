from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, nullable=True, default="General") # Flour, Dairy, Sugar, Packaging, etc.
    quantity = Column(Numeric(10, 3), nullable=False, default=0.000) # Current stock
    unit = Column(String, nullable=False, default="kg") # kg, g, l, ml, pcs, box, packet, dozen
    min_stock = Column(Numeric(10, 3), nullable=False, default=5.000) # Threshold for Low Stock alert
    unit_cost = Column(Numeric(10, 2), nullable=False, default=0.00) # Cost per unit (e.g. ₹ per kg)
    supplier = Column(String, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    recipe_items = relationship("RecipeItem", back_populates="ingredient")
    inventory_transactions = relationship("InventoryTransaction", back_populates="ingredient")
