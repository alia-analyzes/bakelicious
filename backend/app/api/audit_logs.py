from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogResponse
from app.models.user import User
from app.auth.permissions import require_permission

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("AUDIT_LOGS_VIEW"))
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return logs
