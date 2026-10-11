from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.models.user import User
from app.models.role import Role, Permission, RolePermission, UserRole
from app.schemas.rbac import (
    RoleResponse, RoleCreate, RoleUpdate, RolePermissionsUpdate, PermissionResponse
)
from app.auth.permissions import require_permission, require_super_admin
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/roles", tags=["Role Management"])

def format_role_response(role: Role, db: Session) -> dict:
    user_count = db.query(UserRole).filter(UserRole.role_id == role.id).count()
    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "is_system_role": role.is_system_role,
        "created_at": role.created_at,
        "permissions": [
            {
                "id": p.id,
                "code": p.code,
                "name": p.name,
                "description": p.description,
                "module": p.module,
                "action": p.action
            }
            for p in role.permissions
        ],
        "user_count": user_count
    }

@router.get("", response_model=List[RoleResponse])
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ROLE_MANAGEMENT"))
):
    """List all available system and custom roles."""
    roles = db.query(Role).order_by(Role.is_system_role.desc(), Role.name.asc()).all()
    return [format_role_response(r, db) for r in roles]

@router.get("/{role_id}", response_model=RoleResponse)
def get_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ROLE_MANAGEMENT"))
):
    """Retrieve details and permissions for a specific role."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")
    return format_role_response(role, db)

@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    payload: RoleCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ROLE_MANAGEMENT"))
):
    """Create a new custom ERP role with selected permissions."""
    name_clean = payload.name.strip()
    existing = db.query(Role).filter(func.lower(Role.name) == name_clean.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Role with name '{name_clean}' already exists.")

    new_role = Role(
        name=name_clean,
        description=payload.description.strip() if payload.description else None,
        is_system_role=False
    )
    db.add(new_role)
    db.flush()

    if payload.permission_codes:
        for code in payload.permission_codes:
            perm = db.query(Permission).filter(Permission.code == code).first()
            if perm:
                db.add(RolePermission(role_id=new_role.id, permission_id=perm.id))

    db.commit()
    db.refresh(new_role)

    log_audit_action(
        db,
        action="ROLE_CREATE",
        entity_type="Role",
        entity_id=str(new_role.id),
        details={"name": new_role.name, "permissions": payload.permission_codes},
        user=current_user,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:250]
    )

    return format_role_response(new_role, db)

@router.put("/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: int,
    payload: RoleUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ROLE_MANAGEMENT"))
):
    """Update role name, description, or assigned permissions."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")

    if payload.name and payload.name.strip() != role.name:
        if role.is_system_role:
            raise HTTPException(status_code=400, detail="Cannot rename a built-in system role.")
        name_clean = payload.name.strip()
        existing = db.query(Role).filter(func.lower(Role.name) == name_clean.lower(), Role.id != role_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Another role with this name already exists.")
        role.name = name_clean

    if payload.description is not None:
        role.description = payload.description

    if payload.permission_codes is not None:
        # Rebuild permissions
        db.query(RolePermission).filter(RolePermission.role_id == role.id).delete()
        for code in payload.permission_codes:
            perm = db.query(Permission).filter(Permission.code == code).first()
            if perm:
                db.add(RolePermission(role_id=role.id, permission_id=perm.id))

    db.commit()
    db.refresh(role)

    log_audit_action(
        db,
        action="ROLE_UPDATE",
        entity_type="Role",
        entity_id=str(role.id),
        details={"name": role.name},
        user=current_user,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:250]
    )

    return format_role_response(role, db)

@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ROLE_MANAGEMENT"))
):
    """
    Delete a custom role.
    System roles cannot be deleted.
    Custom roles cannot be deleted if active users are assigned.
    """
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")

    if role.is_system_role:
        raise HTTPException(status_code=400, detail="Built-in system roles cannot be deleted.")

    assigned_users_count = db.query(UserRole).filter(UserRole.role_id == role.id).count()
    if assigned_users_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete role '{role.name}' because {assigned_users_count} user(s) are assigned to it. Reassign those users first."
        )

    role_name = role.name
    db.delete(role)
    db.commit()

    log_audit_action(
        db,
        action="ROLE_DELETE",
        entity_type="Role",
        entity_id=str(role_id),
        details={"name": role_name},
        user=current_user,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:250]
    )

    return None
