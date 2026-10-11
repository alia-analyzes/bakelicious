from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class PermissionResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    module: str
    action: Optional[str] = None

    class Config:
        from_attributes = True

class PermissionOverrideResponse(BaseModel):
    id: int
    user_id: int
    permission_id: int
    effect: str # 'GRANT' or 'DENY'
    permission: Optional[PermissionResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PermissionOverrideItem(BaseModel):
    permission_code: str
    effect: str # 'GRANT' or 'DENY'

class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_system_role: bool
    created_at: datetime
    permissions: List[PermissionResponse] = []
    user_count: Optional[int] = 0

    class Config:
        from_attributes = True

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permission_codes: List[str] = []

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_codes: Optional[List[str]] = None

class RolePermissionsUpdate(BaseModel):
    permission_codes: List[str]

class UserSessionResponse(BaseModel):
    id: int
    session_id: str
    created_at: datetime
    expires_at: datetime
    last_used_at: datetime
    revoked_at: Optional[datetime] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True

class UserCreateRBAC(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    password: Optional[str] = None # If not provided, generates a secure random password
    role_id: Optional[int] = None # Primary role
    role_name: Optional[str] = None # Alternative: assign by role name
    is_active: Optional[bool] = True
    force_password_change: Optional[bool] = False
    permission_overrides: Optional[List[PermissionOverrideItem]] = [] # Custom GRANT/DENY overrides

class UserUpdateRBAC(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    role_id: Optional[int] = None
    role_name: Optional[str] = None
    is_active: Optional[bool] = None
    force_password_change: Optional[bool] = None
    permission_overrides: Optional[List[PermissionOverrideItem]] = None

class UserStatusUpdate(BaseModel):
    is_active: bool

class UserResponseRBAC(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    is_superadmin: bool
    is_active: bool
    force_password_change: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    roles: List[str] = []
    primary_role: str = "Staff"
    effective_permissions: List[str] = []
    permission_overrides: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

class UserCredentialsResponse(BaseModel):
    user: UserResponseRBAC
    temporary_password: str
    message: str = "Please store these credentials safely. The password will not be shown again."

class PasswordResetRequest(BaseModel):
    new_password: Optional[str] = None # If not provided, generates temporary password
    force_password_change: bool = True

class PasswordResetResponse(BaseModel):
    user_id: int
    temporary_password: str
    message: str = "Password reset successful. All active sessions have been revoked."

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class BakerSummary(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    email: str
    is_active: bool
    active_tasks_count: int = 0
