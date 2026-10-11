from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False) # e.g. ORD-1001
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    order_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    delivery_date = Column(DateTime, nullable=False)
    delivery_time = Column(String, nullable=True, default="12:00 PM")
    production_date = Column(DateTime, nullable=True)
    
    subtotal = Column(Numeric(10, 2), nullable=False, default=0.00)
    discount = Column(Numeric(10, 2), nullable=False, default=0.00)
    final_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    advance_paid = Column(Numeric(10, 2), nullable=False, default=0.00)
    remaining_paid = Column(Numeric(10, 2), nullable=False, default=0.00)
    
    payment_status = Column(String, default="Pending") # Pending, Partial, Paid
    order_status = Column(String, default="Received") 
    # Workflow: Received -> Confirmed -> Preparing -> Baking -> Decorating -> Ready -> Out for Delivery -> Delivered (or Cancelled)
    
    special_instructions = Column(Text, nullable=True)
    delivery_address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    inventory_deducted = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    production = relationship("Production", back_populates="order", uselist=False, cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    size_override = Column(String, nullable=True)
    unit_price = Column(Numeric(10, 2), nullable=False, default=0.00)
    subtotal = Column(Numeric(10, 2), nullable=False, default=0.00)
    notes = Column(Text, nullable=True)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
