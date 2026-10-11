from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database.connection import get_db
from app.models.user import User
from app.models.role import UserSession

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session has expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        session_id: Optional[str] = payload.get("sid")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None or not user.is_active:
        raise credentials_exception

    # If token has a session_id, check if session is active and not revoked
    if session_id:
        user_sess = db.query(UserSession).filter(
            UserSession.session_id == session_id,
            UserSession.user_id == user.id
        ).first()
        if not user_sess or user_sess.revoked_at is not None or user_sess.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has been revoked or expired. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # Update last_used_at periodically
        user_sess.last_used_at = datetime.utcnow()
        db.commit()

    return user

def get_optional_current_user(token: Optional[str] = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        session_id: Optional[str] = payload.get("sid")
        if email is None:
            return None
        user = db.query(User).filter(User.email == email).first()
        if not user or not user.is_active:
            return None

        if session_id:
            user_sess = db.query(UserSession).filter(
                UserSession.session_id == session_id,
                UserSession.user_id == user.id
            ).first()
            if not user_sess or user_sess.revoked_at is not None or user_sess.expires_at < datetime.utcnow():
                return None

        return user
    except Exception:
        return None
