from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    type = Column(String, nullable=False) # PURCHASE, PRODUCTION_CONSUMPTION, ADJUSTMENT, WASTAGE, RETURN
    quantity_change = Column(Numeric(10, 3), nullable=False) # Positive for additions, negative for deductions
    unit_cost_at_time = Column(Numeric(10, 2), nullable=True)
    reference_id = Column(String, nullable=True) # Order # or Expense #
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ingredient = relationship("Ingredient", back_populates="inventory_transactions")
