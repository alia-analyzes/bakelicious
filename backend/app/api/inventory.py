from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.models.ingredient import Ingredient
from app.models.inventory import InventoryTransaction
from app.schemas.inventory import StockAdjustmentCreate, InventoryTransactionResponse
from app.models.user import User
from app.auth.permissions import require_permission
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/transactions", response_model=List[InventoryTransactionResponse])
def get_inventory_transactions(
    ingredient_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("INVENTORY_VIEW"))
):
    query = db.query(InventoryTransaction)
    if ingredient_id:
        query = query.filter(InventoryTransaction.ingredient_id == ingredient_id)
        
    transactions = query.order_by(InventoryTransaction.created_at.desc()).all()
    return [
        {
            "id": t.id,
            "ingredient_id": t.ingredient_id,
            "type": t.type,
            "quantity_change": float(t.quantity_change or 0.0),
            "unit_cost_at_time": float(t.unit_cost_at_time or 0.0) if t.unit_cost_at_time else None,
            "reference_id": t.reference_id,
            "notes": t.notes,
            "created_at": t.created_at,
            "ingredient": t.ingredient
        }
        for t in transactions
    ]

@router.post("/adjust", response_model=InventoryTransactionResponse, status_code=status.HTTP_201_CREATED)
def adjust_inventory(
    payload: StockAdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("INVENTORY_ADJUST"))
):
    ingredient = db.query(Ingredient).filter(Ingredient.id == payload.ingredient_id, Ingredient.is_deleted == False).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    change = Decimal(str(payload.quantity_change))
    new_qty = Decimal(str(ingredient.quantity)) + change
    if new_qty < Decimal("0.00"):
        raise HTTPException(status_code=400, detail="Stock adjustment results in negative stock quantity")

    ingredient.quantity = new_qty
    if payload.unit_cost_at_time is not None:
        ingredient.unit_cost = Decimal(str(payload.unit_cost_at_time))

    transaction = InventoryTransaction(
        ingredient_id=ingredient.id,
        type=payload.type,
        quantity_change=change,
        unit_cost_at_time=payload.unit_cost_at_time or float(ingredient.unit_cost),
        reference_id="Manual Adjustment",
        notes=payload.notes
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    log_audit_action(db, "INVENTORY_ADJUST", "Inventory", str(ingredient.id), {"ingredient": ingredient.name, "type": payload.type, "change": float(change)}, current_user)
    
    return {
        "id": transaction.id,
        "ingredient_id": transaction.ingredient_id,
        "type": transaction.type,
        "quantity_change": float(transaction.quantity_change),
        "unit_cost_at_time": float(transaction.unit_cost_at_time or 0.0) if transaction.unit_cost_at_time else None,
        "reference_id": transaction.reference_id,
        "notes": transaction.notes,
        "created_at": transaction.created_at,
        "ingredient": ingredient
    }
