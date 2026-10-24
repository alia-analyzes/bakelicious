from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from sqlalchemy.exc import IntegrityError

from app.database.connection import get_db
from app.models.receipt import Receipt
from app.models.user import User
from app.schemas.receipt import ReceiptCreate, ReceiptUpdate, ReceiptResponse
from app.auth.jwt import get_optional_current_user
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/receipts", tags=["Receipts"])

MONTH_CODES = {
    1: "JA",
    2: "FE",
    3: "MR",
    4: "AL",
    5: "MA",
    6: "JN",
    7: "JL",
    8: "AU",
    9: "SE",
    10: "OC",
    11: "NV",
    12: "DE",
}

def generate_next_receipt_number(db: Session, target_date: Optional[datetime] = None) -> str:
    """
    Generates receipt number in format: BLX-MMYY-CXX
    Examples:
    - October 2026: BLX-OC26-C01
    - November 2026: BLX-NV26-C01
    - December 2026: BLX-DE26-C01
    Resets counter to 01 each month. Extends past 99 automatically (e.g. C100).
    """
    if not target_date:
        target_date = datetime.utcnow()

    month_code = MONTH_CODES.get(target_date.month, f"{target_date.month:02d}")
    year_str = f"{target_date.year % 100:02d}"
    prefix = f"BLX-{month_code}{year_str}-C"

    # Query all receipts starting with prefix
    existing = db.query(Receipt.receipt_number).filter(
        Receipt.receipt_number.like(f"{prefix}%")
    ).all()

    max_num = 0
    prefix_len = len(prefix)
    for row in existing:
        num_str = row[0][prefix_len:]
        if num_str.isdigit():
            val = int(num_str)
            if val > max_num:
                max_num = val

    next_num = max_num + 1
    if next_num < 100:
        return f"{prefix}{next_num:02d}"
    else:
        return f"{prefix}{next_num}"

def calculate_receipt_totals(data: dict) -> dict:
    cake_amount = max(0.0, float(data.get("cake_amount") or 0.0))
    
    order_type = data.get("order_type") or "Self Pick-up"
    if order_type == "Self Pick-up":
        delivery_charges = 0.0
    else:
        delivery_charges = max(0.0, float(data.get("delivery_charges") or 0.0))

    candles_required = bool(data.get("candles_required", False))
    if candles_required:
        candle_qty = max(0, int(data.get("candle_quantity") or 0))
        candle_price = max(0.0, float(data.get("candle_price_per_unit") or 0.0))
        total_candle_charges = round(candle_qty * candle_price, 2)
    else:
        candle_qty = 0
        candle_price = 0.0
        total_candle_charges = 0.0

    final_total = round(cake_amount + delivery_charges + total_candle_charges, 2)
    advance_paid = max(0.0, float(data.get("advance_paid") or 0.0))
    # Due amount cannot be negative
    due_amount = max(0.0, round(final_total - advance_paid, 2))

    return {
        "cake_amount": cake_amount,
        "delivery_charges": delivery_charges,
        "candles_required": candles_required,
        "candle_quantity": candle_qty,
        "candle_price_per_unit": candle_price,
        "total_candle_charges": total_candle_charges,
        "final_total": final_total,
        "advance_paid": advance_paid,
        "due_amount": due_amount,
    }

@router.get("/next-number")
def get_next_number(date: Optional[str] = None, db: Session = Depends(get_db)):
    target_dt = None
    if date:
        try:
            target_dt = datetime.fromisoformat(date)
        except Exception:
            pass
    next_num = generate_next_receipt_number(db, target_dt)
    return {"receipt_number": next_num}

@router.get("", response_model=List[ReceiptResponse])
def get_receipts(
    search: Optional[str] = Query(None, description="Search by receipt number, customer name, or phone"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Receipt).filter(Receipt.is_deleted == False)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Receipt.receipt_number.ilike(search_fmt),
                Receipt.customer_name.ilike(search_fmt),
                Receipt.phone_number.ilike(search_fmt),
                Receipt.cake_flavour.ilike(search_fmt)
            )
        )

    receipts = query.order_by(desc(Receipt.receipt_date), desc(Receipt.id)).offset(offset).limit(limit).all()
    return receipts

@router.get("/{receipt_id}", response_model=ReceiptResponse)
def get_receipt(receipt_id: int, db: Session = Depends(get_db)):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id, Receipt.is_deleted == False).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt

@router.post("", response_model=ReceiptResponse, status_code=status.HTTP_201_CREATED)
def create_receipt(
    payload: ReceiptCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    data_dict = payload.dict()
    totals = calculate_receipt_totals(data_dict)
    data_dict.update(totals)

    receipt_dt = data_dict.get("receipt_date") or datetime.utcnow()
    data_dict["receipt_date"] = receipt_dt

    # Handle concurrent generation & uniqueness
    max_retries = 5
    saved_receipt = None

    for attempt in range(max_retries):
        # Generate number if not provided or if retrying
        if attempt > 0 or not data_dict.get("receipt_number"):
            data_dict["receipt_number"] = generate_next_receipt_number(db, receipt_dt)
        else:
            # Check if user-provided number already exists
            existing = db.query(Receipt).filter(Receipt.receipt_number == data_dict["receipt_number"]).first()
            if existing:
                data_dict["receipt_number"] = generate_next_receipt_number(db, receipt_dt)

        receipt = Receipt(
            receipt_number=data_dict["receipt_number"],
            receipt_date=data_dict["receipt_date"],
            customer_name=data_dict["customer_name"].strip(),
            phone_number=data_dict["phone_number"].strip(),
            customer_address=data_dict.get("customer_address"),
            cake_flavour=data_dict.get("cake_flavour"),
            cake_weight=data_dict.get("cake_weight"),
            delivery_date=data_dict.get("delivery_date"),
            delivery_time=data_dict.get("delivery_time"),
            order_type=data_dict.get("order_type", "Self Pick-up"),
            delivery_address=data_dict.get("delivery_address") if data_dict.get("order_type") == "Home Delivery" else None,
            cake_amount=data_dict["cake_amount"],
            delivery_charges=data_dict["delivery_charges"],
            candles_required=data_dict["candles_required"],
            candle_type=data_dict.get("candle_type") if data_dict["candles_required"] else None,
            candle_quantity=data_dict["candle_quantity"],
            candle_price_per_unit=data_dict["candle_price_per_unit"],
            total_candle_charges=data_dict["total_candle_charges"],
            final_total=data_dict["final_total"],
            advance_paid=data_dict["advance_paid"],
            due_amount=data_dict["due_amount"],
            notes=data_dict.get("notes"),
            created_by_id=current_user.id if current_user else None
        )

        try:
            db.add(receipt)
            db.commit()
            db.refresh(receipt)
            saved_receipt = receipt
            break
        except IntegrityError:
            db.rollback()
            if attempt == max_retries - 1:
                raise HTTPException(status_code=500, detail="Failed to generate unique receipt number. Please try again.")

    if current_user and saved_receipt:
        log_audit_action(
            db, "RECEIPT_CREATE", "Receipt", str(saved_receipt.id),
            {"receipt_number": saved_receipt.receipt_number, "customer": saved_receipt.customer_name, "total": float(saved_receipt.final_total)},
            current_user
        )

    return saved_receipt

@router.put("/{receipt_id}", response_model=ReceiptResponse)
def update_receipt(
    receipt_id: int,
    payload: ReceiptUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id, Receipt.is_deleted == False).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    data_dict = payload.dict(exclude_unset=True)
    totals = calculate_receipt_totals(data_dict)
    data_dict.update(totals)

    # Customer Details
    if "customer_name" in data_dict:
        receipt.customer_name = data_dict["customer_name"].strip()
    if "phone_number" in data_dict:
        receipt.phone_number = data_dict["phone_number"].strip()
    if "customer_address" in data_dict:
        receipt.customer_address = data_dict["customer_address"]
    if "receipt_date" in data_dict and data_dict["receipt_date"]:
        receipt.receipt_date = data_dict["receipt_date"]

    # Cake Details
    if "cake_flavour" in data_dict:
        receipt.cake_flavour = data_dict["cake_flavour"]
    if "cake_weight" in data_dict:
        receipt.cake_weight = data_dict["cake_weight"]
    if "delivery_date" in data_dict:
        receipt.delivery_date = data_dict["delivery_date"]
    if "delivery_time" in data_dict:
        receipt.delivery_time = data_dict["delivery_time"]
    if "order_type" in data_dict:
        receipt.order_type = data_dict["order_type"]
    if "delivery_address" in data_dict:
        receipt.delivery_address = data_dict["delivery_address"] if receipt.order_type == "Home Delivery" else None

    # Pricing & Calculations
    receipt.cake_amount = data_dict["cake_amount"]
    receipt.delivery_charges = data_dict["delivery_charges"]
    receipt.candles_required = data_dict["candles_required"]
    receipt.candle_type = data_dict.get("candle_type") if receipt.candles_required else None
    receipt.candle_quantity = data_dict["candle_quantity"]
    receipt.candle_price_per_unit = data_dict["candle_price_per_unit"]
    receipt.total_candle_charges = data_dict["total_candle_charges"]
    receipt.final_total = data_dict["final_total"]
    receipt.advance_paid = data_dict["advance_paid"]
    receipt.due_amount = data_dict["due_amount"]

    if "notes" in data_dict:
        receipt.notes = data_dict["notes"]

    receipt.updated_at = datetime.utcnow()

    # Note: receipt.receipt_number is strictly preserved and NEVER modified on edit!
    db.commit()
    db.refresh(receipt)

    if current_user:
        log_audit_action(
            db, "RECEIPT_UPDATE", "Receipt", str(receipt.id),
            {"receipt_number": receipt.receipt_number, "customer": receipt.customer_name, "total": float(receipt.final_total)},
            current_user
        )

    return receipt

@router.delete("/{receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id, Receipt.is_deleted == False).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    receipt.is_deleted = True
    receipt.updated_at = datetime.utcnow()
    db.commit()

    if current_user:
        log_audit_action(
            db, "RECEIPT_DELETE", "Receipt", str(receipt.id),
            {"receipt_number": receipt.receipt_number},
            current_user
        )
    return None
