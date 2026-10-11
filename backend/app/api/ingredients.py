from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.models.ingredient import Ingredient
from app.schemas.ingredient import IngredientCreate, IngredientUpdate, IngredientResponse
from app.models.user import User
from app.auth.permissions import require_permission
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/ingredients", tags=["Ingredients"])

def format_ingredient(ing: Ingredient) -> dict:
    return {
        "id": ing.id,
        "name": ing.name,
        "category": ing.category or "General",
        "quantity": float(ing.quantity or 0.0),
        "unit": ing.unit,
        "min_stock": float(ing.min_stock or 0.0),
        "unit_cost": float(ing.unit_cost or 0.0),
        "supplier": ing.supplier,
        "is_low_stock": float(ing.quantity or 0.0) <= float(ing.min_stock or 0.0),
        "updated_at": ing.updated_at
    }

@router.get("", response_model=List[IngredientResponse])
def get_ingredients(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("INVENTORY_VIEW"))
):
    query = db.query(Ingredient).filter(Ingredient.is_deleted == False)
    if search:
        query = query.filter(Ingredient.name.ilike(f"%{search}%"))
    ingredients = query.order_by(Ingredient.name.asc()).all()
    return [format_ingredient(i) for i in ingredients]

@router.post("", response_model=IngredientResponse, status_code=status.HTTP_201_CREATED)
def create_ingredient(
    payload: IngredientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("INVENTORY_CREATE"))
):
    ingredient = Ingredient(**payload.model_dump())
    db.add(ingredient)
    db.commit()
    db.refresh(ingredient)
    log_audit_action(db, "INGREDIENT_CREATE", "Ingredient", str(ingredient.id), {"name": ingredient.name}, current_user)
    return format_ingredient(ingredient)

@router.put("/{ingredient_id}", response_model=IngredientResponse)
def update_ingredient(
    ingredient_id: int,
    payload: IngredientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("INVENTORY_EDIT"))
):
    ing = db.query(Ingredient).filter(Ingredient.id == ingredient_id, Ingredient.is_deleted == False).first()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingredient not found")
        
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ing, key, value)
        
    db.commit()
    db.refresh(ing)
    log_audit_action(db, "INGREDIENT_UPDATE", "Ingredient", str(ing.id), update_data, current_user)
    return format_ingredient(ing)

@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ingredient(
    ingredient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("INVENTORY_EDIT"))
):
    ing = db.query(Ingredient).filter(Ingredient.id == ingredient_id, Ingredient.is_deleted == False).first()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingredient not found")
        
    ing.is_deleted = True
    db.commit()
    log_audit_action(db, "INGREDIENT_DELETE", "Ingredient", str(ingredient_id), {"name": ing.name}, current_user)
    return None
