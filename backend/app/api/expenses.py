from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseResponse
from app.models.user import User
from app.auth.permissions import require_permission
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/expenses", tags=["Expenses"])

def format_expense(e: Expense) -> dict:
    return {
        "id": e.id,
        "name": e.name,
        "category": e.category or "Other",
        "amount": float(e.amount or 0.0),
        "expense_date": e.expense_date,
        "description": e.description,
        "receipt_url": e.receipt_url,
        "created_at": e.created_at
    }

@router.get("", response_model=List[ExpenseResponse])
def get_expenses(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("EXPENSES_VIEW"))
):
    query = db.query(Expense)
    if category:
        query = query.filter(Expense.category == category)
    expenses = query.order_by(Expense.expense_date.desc()).all()
    return [format_expense(e) for e in expenses]

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("EXPENSES_CREATE"))
):
    expense = Expense(
        name=payload.name,
        category=payload.category,
        amount=payload.amount,
        expense_date=payload.expense_date or datetime.utcnow(),
        description=payload.description,
        receipt_url=payload.receipt_url
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    log_audit_action(db, "EXPENSE_CREATE", "Expense", str(expense.id), {"name": expense.name, "amount": payload.amount}, current_user)
    return format_expense(expense)

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("EXPENSES_DELETE"))
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    db.delete(expense)
    db.commit()
    log_audit_action(db, "EXPENSE_DELETE", "Expense", str(expense_id), {"name": expense.name}, current_user)
    return None
