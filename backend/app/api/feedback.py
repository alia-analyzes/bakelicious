from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate, FeedbackUpdate, FeedbackResponse
from app.models.user import User
from app.auth.permissions import require_permission
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/feedback", tags=["Feedback"])

@router.get("", response_model=List[FeedbackResponse])
def get_public_feedback(db: Session = Depends(get_db)):
    """Public endpoint: Returns only published customer feedback."""
    return db.query(Feedback).filter(Feedback.is_published == True).order_by(Feedback.created_at.desc()).all()

@router.get("/admin", response_model=List[FeedbackResponse])
def get_all_feedback_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("FEEDBACK_VIEW"))
):
    """Admin-only endpoint: Returns all feedback including draft/unpublished items."""
    return db.query(Feedback).order_by(Feedback.created_at.desc()).all()

@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def create_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("FEEDBACK_CREATE"))
):
    item = Feedback(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    log_audit_action(db, "FEEDBACK_CREATE", "Feedback", str(item.id), {"customer_name": item.customer_name}, current_user)
    return item

@router.put("/{feedback_id}", response_model=FeedbackResponse)
def update_feedback(
    feedback_id: int,
    payload: FeedbackUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("FEEDBACK_EDIT"))
):
    item = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Feedback not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(item, key, val)

    db.commit()
    db.refresh(item)
    log_audit_action(db, "FEEDBACK_UPDATE", "Feedback", str(item.id), update_data, current_user)
    return item

@router.delete("/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("FEEDBACK_DELETE"))
):
    item = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Feedback not found")

    db.delete(item)
    db.commit()
    log_audit_action(db, "FEEDBACK_DELETE", "Feedback", str(feedback_id), {"customer_name": item.customer_name}, current_user)
    return None
