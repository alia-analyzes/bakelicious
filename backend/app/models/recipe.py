from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), unique=True, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="recipe")
    recipe_items = relationship("RecipeItem", back_populates="recipe", cascade="all, delete-orphan")

class RecipeItem(Base):
    __tablename__ = "recipe_items"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    quantity_required = Column(Numeric(10, 3), nullable=False) # In ingredient's unit
    unit = Column(String, nullable=True)

    recipe = relationship("Recipe", back_populates="recipe_items")
    ingredient = relationship("Ingredient", back_populates="recipe_items")
