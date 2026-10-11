from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database.connection import get_db
from app.models.production import Production
from app.models.order import Order
from app.models.user import User
from app.schemas.production import (
    ProductionStatusUpdate, ProductionResponse, ProductionAssignPayload
)
from app.auth.jwt import get_current_user
from app.auth.permissions import (
    require_permission, require_any_permission, get_user_effective_permissions,
    verify_production_access
)
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/production", tags=["Production"])

@router.get("", response_model=List[ProductionResponse])
def get_production_tasks(
    status: Optional[str] = None,
    baker_id: Optional[int] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List kitchen production schedule.
    - Super Admin or users with PRODUCTION_VIEW_ALL see all tasks (and can filter by baker_id).
    - Bakers with only PRODUCTION_VIEW_OWN are strictly filtered to their own tasks.
    """
    user_perms = get_user_effective_permissions(current_user, db)
    can_view_all = current_user.is_superadmin or "PRODUCTION_VIEW_ALL" in user_perms
    can_view_own = "PRODUCTION_VIEW_OWN" in user_perms

    if not (can_view_all or can_view_own):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to view the production schedule."
        )

    query = db.query(Production).join(Order).filter(Order.order_status != "Cancelled")

    if not can_view_all:
        # Resource-level filter: Baker only sees own tasks
        query = query.filter(Production.assigned_to_id == current_user.id)
    elif baker_id is not None:
        query = query.filter(Production.assigned_to_id == baker_id)

    if status and status.lower() != "all":
        query = query.filter(Production.status == status)

    if priority and priority.lower() != "all":
        query = query.filter(Production.priority == priority)

    tasks = query.order_by(Production.production_date.asc(), Production.id.asc()).all()
    return tasks

@router.get("/{production_id}", response_model=ProductionResponse)
def get_production_task(
    production_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve single production task with resource-level permission verification."""
    return verify_production_access(production_id, action="view", current_user=current_user, db=db)

@router.put("/{production_id}", response_model=ProductionResponse)
def update_production_stage(
    production_id: int,
    payload: ProductionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update kitchen baking stage.
    Verifies that the user has permission to edit this specific production task.
    """
    prod = verify_production_access(production_id, action="status", current_user=current_user, db=db)

    old_status = prod.status
    prod.status = payload.status
    prod.stage_updated_at = datetime.utcnow()
    if payload.notes:
        prod.notes = payload.notes

    # Sync stage with customer order status
    if prod.order:
        if payload.status in ["Preparing", "Baking", "Decorating", "Quality Check", "Ready"]:
            prod.order.order_status = "Ready" if payload.status == "Ready" else payload.status
        elif payload.status == "Completed":
            prod.order.order_status = "Ready"

    db.commit()
    db.refresh(prod)

    log_audit_action(
        db,
        action="PRODUCTION_STATUS_UPDATE",
        entity_type="Production",
        entity_id=str(prod.id),
        old_values={"status": old_status},
        new_values={"status": prod.status},
        user=current_user
    )
    return prod

@router.put("/{production_id}/assign", response_model=ProductionResponse)
def assign_production_baker(
    production_id: int,
    payload: ProductionAssignPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("PRODUCTION_ASSIGN"))
):
    """
    Assign or reassign a production task to a specific baker and set priority.
    Requires PRODUCTION_ASSIGN permission.
    """
    prod = db.query(Production).filter(Production.id == production_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Production task not found.")

    assigned_baker_name = "Unassigned"
    if payload.assigned_to_id:
        baker = db.query(User).filter(User.id == payload.assigned_to_id, User.is_active == True).first()
        if not baker:
            raise HTTPException(status_code=400, detail="Invalid baker selected or baker is inactive.")
        assigned_baker_name = baker.username

    old_assigned_id = prod.assigned_to_id
    prod.assigned_to_id = payload.assigned_to_id
    prod.assigned_by_id = current_user.id
    prod.assigned_at = datetime.utcnow()
    if payload.priority:
        prod.priority = payload.priority
    if payload.notes:
        prod.notes = payload.notes

    db.commit()
    db.refresh(prod)

    log_audit_action(
        db,
        action="PRODUCTION_ASSIGN",
        entity_type="Production",
        entity_id=str(prod.id),
        old_values={"assigned_to_id": old_assigned_id},
        new_values={"assigned_to_id": prod.assigned_to_id, "baker": assigned_baker_name, "priority": prod.priority},
        user=current_user
    )
    return prod
