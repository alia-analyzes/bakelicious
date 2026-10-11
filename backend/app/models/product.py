from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    sku = Column(String, index=True, nullable=True)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False, default=0.00)
    manual_cost = Column(Numeric(10, 2), nullable=True, default=0.00)
    use_manual_cost = Column(Boolean, default=False)
    prep_time_hours = Column(Numeric(5, 2), default=1.0)
    size = Column(String, nullable=True) # e.g. '1 kg', '500 g', 'Pack of 6'
    availability = Column(Boolean, default=True)
    featured = Column(Boolean, default=False)
    public_visibility = Column(Boolean, default=True)
    tags = Column(JSON, nullable=True, default=list) # e.g. ['Chocolate', 'Eggless', 'Best Seller']
    sizes = Column(JSON, nullable=True, default=list) # e.g. [{'size': '1 Pound', 'selling_price': 1050, 'cost_price': 650}]
    image_url = Column(String, nullable=True)
    gallery_images = Column(JSON, nullable=True, default=list)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    recipe = relationship("Recipe", back_populates="product", uselist=False, cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")
