import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.config import settings
from app.database.connection import get_db
from app.models.user import User
from app.models.role import UserSession, Role, UserRole, UserPermissionOverride
from app.schemas.rbac import UserResponseRBAC, ChangePasswordRequest
from app.auth.security import verify_password, get_password_hash
from app.auth.jwt import create_access_token, get_current_user
from app.auth.permissions import get_user_effective_permissions
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/auth", tags=["Authentication"])

def format_user_rbac_response(user: User, db: Session) -> Dict[str, Any]:
    roles = [ur.role.name for ur in user.user_roles if ur.role]
    primary_role = "Super Admin" if user.is_superadmin else (roles[0] if roles else "Staff")
    effective_perms = list(get_user_effective_permissions(user, db))
    
    overrides_data = []
    for ov in user.permission_overrides:
        if ov.permission:
            overrides_data.append({
                "code": ov.permission.code,
                "name": ov.permission.name,
                "module": ov.permission.module,
                "effect": ov.effect
            })

    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "is_superadmin": user.is_superadmin,
        "is_active": user.is_active,
        "force_password_change": user.force_password_change,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "last_login": user.last_login,
        "roles": roles,
        "primary_role": primary_role,
        "effective_permissions": effective_perms,
        "permission_overrides": overrides_data
    }

@router.post("/login")
async def login(
    request: Request,
    db: Session = Depends(get_db)
):
    username_or_email = ""
    password = ""

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            if isinstance(body, dict):
                username_or_email = body.get("username") or body.get("email") or body.get("email_or_username") or ""
                password = body.get("password") or ""
        except Exception:
            pass
    else:
        try:
            form = await request.form()
            username_or_email = form.get("username") or form.get("email") or form.get("email_or_username") or ""
            password = form.get("password") or ""
        except Exception:
            pass

    username_or_email = username_or_email.strip() if isinstance(username_or_email, str) else ""

    if not username_or_email or not password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    search_identifier = username_or_email.lower()
    user = db.query(User).filter(
        (func.lower(User.email) == search_identifier) | (func.lower(User.username) == search_identifier)
    ).first()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account. Please contact the Bakery Administrator."
        )

    # Create session tracking
    session_id = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")[:250]

    user_sess = UserSession(
        user_id=user.id,
        session_id=session_id,
        expires_at=expires_at,
        ip_address=client_ip,
        user_agent=user_agent
    )
    db.add(user_sess)

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token(data={
        "sub": user.email,
        "uid": user.id,
        "sid": session_id,
        "isa": user.is_superadmin
    })

    log_audit_action(
        db,
        action="USER_LOGIN",
        entity_type="User",
        entity_id=str(user.id),
        details={"email": user.email, "session_id": session_id},
        user=user,
        ip_address=client_ip,
        user_agent=user_agent
    )

    user_data = format_user_rbac_response(user, db)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data
    }

@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return format_user_rbac_response(current_user, db)

@router.post("/logout")
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        try:
            from jose import jwt
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            session_id = payload.get("sid")
            if session_id:
                user_sess = db.query(UserSession).filter(
                    UserSession.session_id == session_id,
                    UserSession.user_id == current_user.id
                ).first()
                if user_sess:
                    user_sess.revoked_at = datetime.utcnow()
                    db.commit()
        except Exception:
            pass

    log_audit_action(
        db,
        action="USER_LOGOUT",
        entity_type="User",
        entity_id=str(current_user.id),
        user=current_user
    )
    return {"message": "Logged out successfully."}

@router.post("/change-password")
def change_own_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )

    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.force_password_change = False
    db.commit()

    log_audit_action(
        db,
        action="USER_CHANGE_PASSWORD",
        entity_type="User",
        entity_id=str(current_user.id),
        user=current_user
    )

    return {"message": "Password updated successfully."}
