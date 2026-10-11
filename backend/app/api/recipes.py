from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.recipe import Recipe, RecipeItem
from app.models.product import Product
from app.models.ingredient import Ingredient
from app.schemas.recipe import RecipeCreate, RecipeResponse
from app.models.user import User
from app.auth.permissions import require_permission, require_any_permission
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/recipes", tags=["Recipes"])

@router.post("", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_recipe(
    payload: RecipeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_permission(["RECIPES_CREATE", "RECIPES_EDIT"]))
):
    product = db.query(Product).filter(Product.id == payload.product_id, Product.is_deleted == False).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    recipe = db.query(Recipe).filter(Recipe.product_id == payload.product_id).first()
    if recipe:
        db.query(RecipeItem).filter(RecipeItem.recipe_id == recipe.id).delete()
        recipe.notes = payload.notes
    else:
        recipe = Recipe(product_id=payload.product_id, notes=payload.notes)
        db.add(recipe)
        db.flush()
        
    for item in payload.items:
        ing = db.query(Ingredient).filter(Ingredient.id == item.ingredient_id, Ingredient.is_deleted == False).first()
        if not ing:
            raise HTTPException(status_code=400, detail=f"Ingredient ID {item.ingredient_id} not found")
            
        r_item = RecipeItem(
            recipe_id=recipe.id,
            ingredient_id=item.ingredient_id,
            quantity_required=item.quantity_required,
            unit=item.unit or ing.unit
        )
        db.add(r_item)
        
    db.commit()
    db.refresh(recipe)
    
    log_audit_action(db, "RECIPE_UPDATE", "Recipe", str(recipe.id), {"product_id": payload.product_id}, current_user)
    return recipe

@router.get("/product/{product_id}", response_model=RecipeResponse)
def get_recipe_for_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("RECIPES_VIEW"))
):
    recipe = db.query(Recipe).filter(Recipe.product_id == product_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="No recipe configured for this product")
    return recipe
