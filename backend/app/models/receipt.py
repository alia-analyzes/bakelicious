from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    receipt_number = Column(String, unique=True, index=True, nullable=False)
    receipt_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Customer Details
    customer_name = Column(String, index=True, nullable=False)
    phone_number = Column(String, index=True, nullable=False)
    customer_address = Column(Text, nullable=True)

    # Cake Details
    cake_flavour = Column(String, nullable=True)
    cake_weight = Column(String, nullable=True) # e.g. "1 kg", "500 grams"
    delivery_date = Column(String, nullable=True)
    delivery_time = Column(String, nullable=True)
    order_type = Column(String, nullable=False, default="Self Pick-up") # "Self Pick-up" or "Home Delivery"
    delivery_address = Column(Text, nullable=True)

    # Pricing & Charges
    items_json = Column(Text, nullable=True)
    cake_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    delivery_charges = Column(Numeric(10, 2), nullable=False, default=0.00)
    
    # Candles
    candles_required = Column(Boolean, default=False)
    candle_type = Column(String, nullable=True)
    candle_quantity = Column(Integer, default=0)
    candle_price_per_unit = Column(Numeric(10, 2), default=0.00)
    total_candle_charges = Column(Numeric(10, 2), default=0.00)

    # Totals & Payments
    final_total = Column(Numeric(10, 2), nullable=False, default=0.00)
    advance_paid = Column(Numeric(10, 2), nullable=False, default=0.00)
    due_amount = Column(Numeric(10, 2), nullable=False, default=0.00)

    # Additional
    notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    created_by = relationship("User", foreign_keys=[created_by_id])
