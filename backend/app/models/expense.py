from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime
from datetime import datetime
from app.database.connection import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, nullable=False, default="Other") # Ingredients, Packaging, Delivery, Electricity, Equipment, Marketing, Rent, Other
    amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    expense_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    description = Column(Text, nullable=True)
    receipt_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
