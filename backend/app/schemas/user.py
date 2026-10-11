from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    role: Optional[str] = "admin"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email_or_username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

Token.update_forward_refs()
