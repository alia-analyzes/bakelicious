from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Union, Dict, Any

from app.database.connection import get_db
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import ProductCreate, ProductUpdate
from app.auth.jwt import get_current_user, get_optional_current_user
from app.models.user import User
from app.auth.permissions import (
    require_permission, require_any_permission, get_user_effective_permissions
)
from app.services.costing import calculate_product_cost
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/products", tags=["Products"])

def format_product_response(product: Product, db: Session, current_user: Optional[User] = None) -> Dict[str, Any]:
    pub_vis = getattr(product, "public_visibility", True)
    if pub_vis is None:
        pub_vis = True

    # If request is from an authenticated ERP user
    if current_user:
        user_perms = get_user_effective_permissions(current_user, db)
        can_view_costs = "PRODUCT_COST_VIEW" in user_perms or "FINANCIAL_REPORTS_VIEW" in user_perms or current_user.is_superadmin

        response: Dict[str, Any] = {
            "id": product.id,
            "category_id": product.category_id,
            "name": product.name,
            "sku": product.sku,
            "description": product.description,
            "price": float(product.price or 0.0),
            "prep_time_hours": float(product.prep_time_hours or 1.0),
            "size": product.size,
            "availability": product.availability,
            "public_visibility": pub_vis,
            "featured": getattr(product, "featured", False),
            "tags": product.tags or [],
            "sizes": product.sizes or [],
            "image_url": product.image_url,
            "gallery_images": product.gallery_images or [],
            "category": product.category,
            "recipe": product.recipe,
            "created_at": product.created_at,
            "updated_at": product.updated_at
        }

        if can_view_costs:
            cost_info = calculate_product_cost(product, db)
            response.update({
                "manual_cost": float(product.manual_cost or 0.0),
                "use_manual_cost": product.use_manual_cost,
                "calculated_cost": cost_info["calculated_cost"],
                "effective_cost": cost_info["effective_cost"],
                "profit": cost_info["profit"],
                "profit_margin": cost_info["profit_margin"]
            })
        else:
            response.update({
                "manual_cost": None,
                "use_manual_cost": False,
                "calculated_cost": None,
                "effective_cost": None,
                "profit": None,
                "profit_margin": None
            })

        return response

    # Unauthenticated public visitors: only public safe fields
    public_sizes = []
    if product.sizes:
        for s in product.sizes:
            if isinstance(s, dict):
                public_sizes.append({
                    "size": str(s.get("size", s.get("name", ""))),
                    "selling_price": float(s.get("selling_price", s.get("price", 0.0)))
                })
            else:
                public_sizes.append({"size": str(s), "selling_price": float(product.price or 0.0)})

    return {
        "id": product.id,
        "category_id": product.category_id,
        "name": product.name,
        "description": product.description,
        "price": float(product.price or 0.0),
        "prep_time_hours": float(product.prep_time_hours or 1.0),
        "size": product.size,
        "availability": product.availability,
        "public_visibility": pub_vis,
        "featured": getattr(product, "featured", False),
        "tags": product.tags or [],
        "sizes": public_sizes,
        "image_url": product.image_url,
        "gallery_images": product.gallery_images or [],
        "category": product.category,
        "created_at": product.created_at,
        "updated_at": product.updated_at
    }

@router.get("")
def get_products(
    category_id: Optional[int] = None,
    available_only: Optional[bool] = None,
    search: Optional[str] = None,
    include_erp: Optional[bool] = Query(False),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    query = db.query(Product).filter(Product.is_deleted == False)

    # For public requests (unauthenticated or include_erp=False)
    if not (current_user and include_erp):
        query = query.filter(
            (Product.public_visibility == True) | (Product.public_visibility == None),
            Product.availability == True
        )
    else:
        # ERP request: check PRODUCTS_VIEW
        user_perms = get_user_effective_permissions(current_user, db)
        if "PRODUCTS_VIEW" not in user_perms and not current_user.is_superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not have permission to view ERP products."
            )
        if available_only is not None:
            query = query.filter(Product.availability == available_only)

    if category_id:
        query = query.filter(Product.category_id == category_id)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_term)) | (Product.description.ilike(search_term)) | (Product.sku.ilike(search_term))
        )

    products = query.order_by(Product.name.asc()).all()
    user_for_formatting = current_user if (current_user and include_erp) else None
    return [format_product_response(p, db, user_for_formatting) for p in products]

@router.get("/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    product = db.query(Product).filter(Product.id == product_id, Product.is_deleted == False).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return format_product_response(product, db, current_user)

@router.post("", status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("PRODUCTS_CREATE"))
):
    category = db.query(Category).filter(Category.id == payload.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Invalid category_id specified")

    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)

    log_audit_action(db, "PRODUCT_CREATE", "Product", str(product.id), {"name": product.name, "price": payload.price}, current_user)
    return format_product_response(product, db, current_user)

@router.put("/{product_id}")
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("PRODUCTS_EDIT"))
):
    product = db.query(Product).filter(Product.id == product_id, Product.is_deleted == False).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = payload.model_dump(exclude_unset=True)
    user_perms = get_user_effective_permissions(current_user, db)

    # Permission check for cost modifications
    if ("manual_cost" in update_data or "use_manual_cost" in update_data) and not current_user.is_superadmin:
        if "PRODUCT_COST_EDIT" not in user_perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Missing permission 'PRODUCT_COST_EDIT' to modify product costs."
            )

    if "category_id" in update_data:
        cat = db.query(Category).filter(Category.id == update_data["category_id"]).first()
        if not cat:
            raise HTTPException(status_code=400, detail="Invalid category_id")

    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    log_audit_action(db, "PRODUCT_UPDATE", "Product", str(product.id), update_data, current_user)
    return format_product_response(product, db, current_user)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("PRODUCTS_DELETE"))
):
    product = db.query(Product).filter(Product.id == product_id, Product.is_deleted == False).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_deleted = True
    db.commit()

    log_audit_action(db, "PRODUCT_DELETE", "Product", str(product_id), {"name": product.name}, current_user)
    return None
