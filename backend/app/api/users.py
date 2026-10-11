import secrets
import string
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.models.user import User
from app.models.role import Role, Permission, UserRole, UserPermissionOverride, UserSession
from app.models.production import Production
from app.schemas.rbac import (
    UserCreateRBAC, UserUpdateRBAC, UserResponseRBAC, UserCredentialsResponse,
    UserStatusUpdate, PasswordResetRequest, PasswordResetResponse,
    PermissionResponse, BakerSummary, UserSessionResponse
)
from app.auth.jwt import get_current_user
from app.auth.security import get_password_hash
from app.auth.permissions import (
    require_permission, require_any_permission, require_super_admin,
    get_user_effective_permissions, PERMISSIONS_DEFINITIONS
)
from app.api.auth import format_user_rbac_response
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/users", tags=["User Management"])

def generate_secure_password(length: int = 10) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return "".join(secrets.choice(alphabet) for _ in range(length))

@router.get("/permissions", response_model=List[PermissionResponse])
def get_all_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_permission(["USER_MANAGEMENT_VIEW", "ROLE_MANAGEMENT"]))
):
    """Returns all available system permissions."""
    perms = db.query(Permission).order_by(Permission.module.asc(), Permission.name.asc()).all()
    return perms

@router.get("/bakers", response_model=List[BakerSummary])
def get_active_bakers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_permission(["PRODUCTION_ASSIGN", "PRODUCTION_VIEW_ALL", "PRODUCTION_VIEW_OWN", "USER_MANAGEMENT_VIEW"]))
):
    """
    Returns list of all active bakers for task assignment dropdowns and production management.
    Identifies users with 'Baker' role or users who have production permissions.
    """
    users = db.query(User).filter(User.is_active == True).all()
    bakers = []
    for u in users:
        perms = get_user_effective_permissions(u, db)
        is_baker_role = any(ur.role and ur.role.name.lower() == "baker" for ur in u.user_roles)
        if is_baker_role or "PRODUCTION_VIEW_OWN" in perms or "PRODUCTION_STATUS_UPDATE" in perms:
            active_tasks = db.query(Production).filter(
                Production.assigned_to_id == u.id,
                Production.status.notin_(["Completed", "Ready"])
            ).count()
            bakers.append({
                "id": u.id,
                "username": u.username,
                "full_name": u.full_name or u.username,
                "email": u.email,
                "is_active": u.is_active,
                "active_tasks_count": active_tasks
            })
    return bakers

@router.get("", response_model=List[UserResponseRBAC])
def get_users(
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("USER_MANAGEMENT_VIEW"))
):
    """List all ERP users with their primary role, status, and effective permissions."""
    query = db.query(User)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.username.ilike(search_term)) |
            (User.email.ilike(search_term)) |
            (User.full_name.ilike(search_term))
        )

    users = query.order_by(User.is_superadmin.desc(), User.created_at.asc()).all()

    result = []
    for u in users:
        formatted = format_user_rbac_response(u, db)
        if role:
            if role.lower() not in [r.lower() for r in formatted["roles"]] and role.lower() != formatted["primary_role"].lower():
                continue
        result.append(formatted)

    return result

@router.get("/{user_id}", response_model=UserResponseRBAC)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("USER_MANAGEMENT_VIEW"))
):
    """Retrieve detailed user information."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return format_user_rbac_response(user, db)

@router.post("", response_model=UserCredentialsResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreateRBAC,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("USER_MANAGEMENT_CREATE"))
):
    """
    Create a new ERP user (Admin or Baker) with role assignment and optional GRANT/DENY overrides.
    Normal admins can NEVER create a Super Admin.
    """
    # Check duplicate email/username
    existing_email = db.query(User).filter(func.lower(User.email) == payload.email.lower().strip()).first()
    if existing_email:
        raise HTTPException(status_code=400, detail=f"Email '{payload.email}' is already registered.")

    existing_username = db.query(User).filter(func.lower(User.username) == payload.username.lower().strip()).first()
    if existing_username:
        raise HTTPException(status_code=400, detail=f"Username '{payload.username}' is already taken.")

    temp_password = payload.password.strip() if payload.password else generate_secure_password(10)
    if len(temp_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    # Create user entity
    new_user = User(
        email=payload.email.lower().strip(),
        username=payload.username.strip(),
        full_name=payload.full_name.strip() if payload.full_name else None,
        hashed_password=get_password_hash(temp_password),
        is_superadmin=False, # Strictly enforce non-superadmin creation
        is_active=payload.is_active if payload.is_active is not None else True,
        force_password_change=payload.force_password_change if payload.force_password_change is not None else True
    )
    db.add(new_user)
    db.flush()

    # Assign role
    assigned_role = None
    if payload.role_id:
        assigned_role = db.query(Role).filter(Role.id == payload.role_id).first()
    elif payload.role_name:
        assigned_role = db.query(Role).filter(func.lower(Role.name) == payload.role_name.lower().strip()).first()

    if assigned_role:
        db.add(UserRole(user_id=new_user.id, role_id=assigned_role.id))

    # Apply custom permission overrides
    if payload.permission_overrides:
        for ov in payload.permission_overrides:
            perm = db.query(Permission).filter(Permission.code == ov.permission_code).first()
            if perm and ov.effect.upper() in ["GRANT", "DENY"]:
                db.add(UserPermissionOverride(
                    user_id=new_user.id,
                    permission_id=perm.id,
                    effect=ov.effect.upper()
                ))

    db.commit()
    db.refresh(new_user)

    log_audit_action(
        db,
        action="USER_CREATE",
        entity_type="User",
        entity_id=str(new_user.id),
        details={"username": new_user.username, "role": assigned_role.name if assigned_role else "None"},
        user=current_user,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:250]
    )

    return {
        "user": format_user_rbac_response(new_user, db),
        "temporary_password": temp_password,
        "message": "User created successfully. Provide these credentials to the user."
    }

@router.put("/{user_id}", response_model=UserResponseRBAC)
def update_user(
    user_id: int,
    payload: UserUpdateRBAC,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("USER_MANAGEMENT_EDIT"))
):
    """
    Update user profile, role assignment, and permission overrides.
    Normal admins cannot modify the Super Admin.
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Guard: Only Super Admin can modify a Super Admin
    if target_user.is_superadmin and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Normal administrators cannot modify the Super Admin / Owner."
        )

    old_state = {
        "email": target_user.email,
        "username": target_user.username,
        "full_name": target_user.full_name,
        "is_active": target_user.is_active
    }

    if payload.email:
        existing = db.query(User).filter(func.lower(User.email) == payload.email.lower().strip(), User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already in use by another user.")
        target_user.email = payload.email.lower().strip()

    if payload.username:
        existing = db.query(User).filter(func.lower(User.username) == payload.username.lower().strip(), User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username is already taken.")
        target_user.username = payload.username.strip()

    if payload.full_name is not None:
        target_user.full_name = payload.full_name.strip()

    if payload.is_active is not None and not target_user.is_superadmin:
        target_user.is_active = payload.is_active

    if payload.force_password_change is not None:
        target_user.force_password_change = payload.force_password_change

    # Update role if provided (cannot change role of Super Admin)
    if not target_user.is_superadmin:
        role_to_set = None
        if payload.role_id:
            role_to_set = db.query(Role).filter(Role.id == payload.role_id).first()
        elif payload.role_name:
            role_to_set = db.query(Role).filter(func.lower(Role.name) == payload.role_name.lower().strip()).first()

        if role_to_set:
            db.query(UserRole).filter(UserRole.user_id == user_id).delete()
            db.add(UserRole(user_id=user_id, role_id=role_to_set.id))

    # Update permission overrides
    if payload.permission_overrides is not None and not target_user.is_superadmin:
        db.query(UserPermissionOverride).filter(UserPermissionOverride.user_id == user_id).delete()
        for ov in payload.permission_overrides:
            perm = db.query(Permission).filter(Permission.code == ov.permission_code).first()
            if perm and ov.effect.upper() in ["GRANT", "DENY"]:
                db.add(UserPermissionOverride(
                    user_id=user_id,
                    permission_id=perm.id,
                    effect=ov.effect.upper()
                ))

    db.commit()
    db.refresh(target_user)

    log_audit_action(
        db,
        action="USER_UPDATE",
        entity_type="User",
        entity_id=str(target_user.id),
        old_values=old_state,
        new_values={"email": target_user.email, "username": target_user.username, "full_name": target_user.full_name},
        user=current_user,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:250]
    )

    return format_user_rbac_response(target_user, db)

@router.put("/{user_id}/status", response_model=UserResponseRBAC)
def set_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("USER_MANAGEMENT_DISABLE"))
):
    """
    Enable or disable a user account.
    The Super Admin / Owner can NEVER be disabled.
    When a user is disabled, all active sessions are immediately revoked.
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if target_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: The Super Admin / Owner account cannot be disabled."
        )

    old_status = target_user.is_active
    target_user.is_active = payload.is_active

    # If deactivating, revoke all active sessions immediately
    if not payload.is_active:
        sessions = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.revoked_at == None
        ).all()
        for s in sessions:
            s.revoked_at = datetime.utcnow()

    db.commit()
    db.refresh(target_user)

    log_audit_action(
        db,
        action="USER_DISABLE" if not payload.is_active else "USER_ENABLE",
        entity_type="User",
        entity_id=str(target_user.id),
        old_values={"is_active": old_status},
        new_values={"is_active": target_user.is_active},
        user=current_user,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:250]
    )

    return format_user_rbac_response(target_user, db)

@router.post("/{user_id}/reset-password", response_model=PasswordResetResponse)
def reset_user_password(
    user_id: int,
    payload: PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("USER_MANAGEMENT_RESET_PWD"))
):
    """
    Reset another user's password.
    - Generates temporary password and hashes it immediately.
    - Revokes all active user sessions.
    - Sets force_password_change = True.
    - Normal admins cannot reset Super Admin password.
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if target_user.is_superadmin and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Normal administrators cannot reset the Super Admin's password."
        )

    temp_password = payload.new_password.strip() if payload.new_password else generate_secure_password(10)
    if len(temp_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    target_user.hashed_password = get_password_hash(temp_password)
    target_user.force_password_change = payload.force_password_change

    # Revoke all active sessions for this user
    sessions = db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.revoked_at == None
    ).all()
    for s in sessions:
        s.revoked_at = datetime.utcnow()

    db.commit()

    log_audit_action(
        db,
        action="USER_PASSWORD_RESET",
        entity_type="User",
        entity_id=str(target_user.id),
        details={"force_password_change": payload.force_password_change},
        user=current_user,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:250]
    )

    return {
        "user_id": target_user.id,
        "temporary_password": temp_password,
        "message": f"Password reset for {target_user.username}. All active sessions have been revoked."
    }

@router.get("/{user_id}/sessions", response_model=List[UserSessionResponse])
def get_user_sessions(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("USER_MANAGEMENT_VIEW"))
):
    """Inspect active and recent sessions for a user."""
    sessions = db.query(UserSession).filter(
        UserSession.user_id == user_id
    ).order_by(UserSession.created_at.desc()).limit(20).all()

    return [
        {
            "id": s.id,
            "session_id": s.session_id,
            "created_at": s.created_at,
            "expires_at": s.expires_at,
            "last_used_at": s.last_used_at,
            "revoked_at": s.revoked_at,
            "ip_address": s.ip_address,
            "user_agent": s.user_agent,
            "is_active": s.revoked_at is None and s.expires_at > datetime.utcnow()
        }
        for s in sessions
    ]
