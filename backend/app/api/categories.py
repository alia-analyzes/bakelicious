from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.category import Category
from app.models.product import Product
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.models.user import User
from app.auth.permissions import require_permission
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    """Public & ERP: returns category list."""
    return db.query(Category).order_by(Category.name.asc()).all()

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("CATEGORIES_CREATE"))
):
    existing = db.query(Category).filter(Category.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")
        
    category = Category(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    
    log_audit_action(db, "CATEGORY_CREATE", "Category", str(category.id), {"name": category.name}, current_user)
    return category

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("CATEGORIES_EDIT"))
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)
        
    db.commit()
    db.refresh(category)
    log_audit_action(db, "CATEGORY_UPDATE", "Category", str(category.id), update_data, current_user)
    return category

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("CATEGORIES_DELETE"))
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    assigned_count = db.query(Product).filter(Product.category_id == category_id, Product.is_deleted == False).count()
    if assigned_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category because {assigned_count} product(s) are still assigned to it."
        )
        
    db.delete(category)
    db.commit()
    log_audit_action(db, "CATEGORY_DELETE", "Category", str(category_id), {"name": category.name}, current_user)
    return None
