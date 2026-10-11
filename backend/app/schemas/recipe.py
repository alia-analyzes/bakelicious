from pydantic import BaseModel
from typing import Optional, List
from app.schemas.ingredient import IngredientResponse

class RecipeItemBase(BaseModel):
    ingredient_id: int
    quantity_required: float
    unit: Optional[str] = None

class RecipeItemCreate(RecipeItemBase):
    pass

class RecipeItemResponse(RecipeItemBase):
    id: int
    ingredient: Optional[IngredientResponse] = None

    class Config:
        from_attributes = True

class RecipeBase(BaseModel):
    notes: Optional[str] = None

class RecipeCreate(RecipeBase):
    product_id: int
    items: List[RecipeItemCreate]

class RecipeResponse(RecipeBase):
    id: int
    product_id: int
    recipe_items: List[RecipeItemResponse] = []

    class Config:
        from_attributes = True
