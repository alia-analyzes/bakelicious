from datetime import datetime, time, date, timedelta
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func

from app.database.connection import get_db
from app.models.order import Order, OrderItem
from app.models.production import Production
from app.models.inventory import InventoryTransaction
from app.models.ingredient import Ingredient
from app.models.calendar_note import CalendarNote
from app.models.user import User
from app.auth.permissions import (
    require_permission,
    require_any_permission,
    get_user_effective_permissions
)
from app.schemas.calendar import (
    CalendarEventResponse,
    CalendarSummaryResponse,
    CalendarNoteCreate,
    CalendarNoteUpdate,
    CalendarNoteResponse,
    CalendarRescheduleRequest
)
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/calendar", tags=["Calendar"])

def parse_iso_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        if dt_str.endswith('Z'):
            dt_str = dt_str[:-1]
        return datetime.fromisoformat(dt_str)
    except Exception:
        try:
            return datetime.strptime(dt_str[:10], "%Y-%m-%d")
        except Exception:
            return None

@router.get("/events", response_model=List[CalendarEventResponse])
def get_calendar_events(
    start: Optional[str] = Query(None, description="Start date (ISO)"),
    end: Optional[str] = Query(None, description="End date (ISO)"),
    baker_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    search: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None, description="Comma separated event types"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("CALENDAR_VIEW"))
):
    effective_perms = get_user_effective_permissions(current_user, db)
    can_view_inventory = "INVENTORY_VIEW" in effective_perms or current_user.is_superadmin
    can_view_all_prod = "PRODUCTION_VIEW_ALL" in effective_perms or current_user.is_superadmin

    start_dt = parse_iso_datetime(start) or (datetime.utcnow() - timedelta(days=30))
    end_dt = parse_iso_datetime(end) or (datetime.utcnow() + timedelta(days=30))

    # Normalize to full day coverage
    start_dt = datetime.combine(start_dt.date(), time.min)
    end_dt = datetime.combine(end_dt.date(), time.max)

    types_set = set(event_type.split(",")) if event_type else None
    now_utc = datetime.utcnow()

    events: List[CalendarEventResponse] = []

    # -------------------------------------------------------------
    # 1. ORDERS & PRODUCTION MILESTONES
    # -------------------------------------------------------------
    order_query = db.query(Order).options(
        joinedload(Order.client),
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.production).joinedload(Production.assigned_baker)
    )

    if baker_id:
        order_query = order_query.join(Production, Order.id == Production.order_id).filter(Production.assigned_to_id == baker_id)
    elif not can_view_all_prod and not current_user.is_superadmin:
        # Restricted baker view
        order_query = order_query.join(Production, Order.id == Production.order_id).filter(Production.assigned_to_id == current_user.id)

    if search:
        search_fmt = f"%{search}%"
        order_query = order_query.filter(
            or_(
                Order.order_number.ilike(search_fmt),
                Order.delivery_address.ilike(search_fmt),
                Order.client.has(name=search_fmt)
            )
        )

    orders = order_query.all()

    for ord in orders:
        client_name = ord.client.name if ord.client else "Customer"
        items_summary = ", ".join([f"{it.quantity}x {it.product.name if it.product else 'Item'}" for it in ord.items[:2]])
        if len(ord.items) > 2:
            items_summary += f" (+{len(ord.items) - 2} more)"
        
        baker_name = ord.production.assigned_baker.full_name or ord.production.assigned_baker.username if (ord.production and ord.production.assigned_baker) else None
        
        # Delivery DateTime calculation
        delivery_dt = ord.delivery_date
        is_late = (now_utc > delivery_dt) and (ord.order_status not in ["Delivered", "Cancelled"])

        order_details = {
            "order_id": ord.id,
            "order_number": ord.order_number,
            "client_name": client_name,
            "client_phone": ord.client.phone if ord.client else "N/A",
            "items_summary": items_summary,
            "final_amount": float(ord.final_amount or 0.0),
            "payment_status": ord.payment_status,
            "order_status": ord.order_status,
            "delivery_date": ord.delivery_date.isoformat() if ord.delivery_date else None,
            "delivery_time": ord.delivery_time or "12:00 PM",
            "production_date": ord.production_date.isoformat() if ord.production_date else None,
            "assigned_baker": baker_name,
            "delivery_address": ord.delivery_address or (ord.client.address if ord.client else "N/A"),
            "special_instructions": ord.special_instructions,
            "notes": ord.notes,
            "is_late": is_late
        }

        # Milestone 1: NEW ORDER (Soft Blue)
        if ord.order_date and start_dt <= ord.order_date <= end_dt:
            if not types_set or "NEW_ORDER" in types_set:
                events.append(CalendarEventResponse(
                    id=f"order-new-{ord.id}",
                    event_type="NEW_ORDER",
                    title=f"🔵 New Order {ord.order_number}",
                    subtitle=client_name,
                    description=f"{items_summary} | ₹{ord.final_amount}",
                    start_datetime=ord.order_date,
                    end_datetime=ord.order_date,
                    all_day=True,
                    status=ord.order_status,
                    priority="Normal",
                    color="#3B82F6", # Soft Blue
                    related_entity_type="ORDER",
                    related_entity_id=ord.id,
                    details=order_details
                ))

        # Milestone 2: MAKING / PRODUCTION (Warm Orange)
        prod_dt = ord.production_date or (ord.production.production_date if ord.production else None)
        if prod_dt and start_dt <= prod_dt <= end_dt:
            if not types_set or "MAKING" in types_set:
                baker_disp = f" 👨‍🍳 {baker_name}" if baker_name else ""
                events.append(CalendarEventResponse(
                    id=f"order-making-{ord.id}",
                    event_type="MAKING",
                    title=f"🟠 Making {ord.order_number}",
                    subtitle=f"{items_summary}{baker_disp}",
                    description=f"Status: {ord.order_status}",
                    start_datetime=prod_dt,
                    end_datetime=prod_dt,
                    all_day=True,
                    status=ord.order_status,
                    priority=ord.production.priority if ord.production else "Normal",
                    color="#F97316", # Warm Orange
                    related_entity_type="PRODUCTION",
                    related_entity_id=ord.production.id if ord.production else ord.id,
                    details=order_details
                ))

        # Milestone 3: LATE / OVERDUE (Crimson Red) - Highest Operational Priority!
        if is_late and (start_dt <= delivery_dt <= end_dt or delivery_dt < start_dt):
            if not types_set or "LATE" in types_set:
                events.append(CalendarEventResponse(
                    id=f"order-late-{ord.id}",
                    event_type="LATE",
                    title=f"🔴 LATE {ord.order_number}",
                    subtitle=f"{client_name} (Due {ord.delivery_time or '12:00 PM'})",
                    description=f"Overdue! Delivery date was {delivery_dt.strftime('%b %d')}",
                    start_datetime=delivery_dt,
                    end_datetime=delivery_dt,
                    all_day=False,
                    status="OVERDUE",
                    priority="Urgent",
                    color="#EF4444", # Crimson Red
                    related_entity_type="ORDER",
                    related_entity_id=ord.id,
                    details=order_details
                ))

        # Milestone 4: READY (Green)
        elif ord.order_status == "Ready" and start_dt <= delivery_dt <= end_dt:
            if not types_set or "READY" in types_set:
                events.append(CalendarEventResponse(
                    id=f"order-ready-{ord.id}",
                    event_type="READY",
                    title=f"🟢 Ready {ord.order_number}",
                    subtitle=client_name,
                    description=f"Ready for pickup/delivery at {ord.delivery_time or '12:00 PM'}",
                    start_datetime=delivery_dt,
                    end_datetime=delivery_dt,
                    all_day=False,
                    status="Ready",
                    priority="High",
                    color="#10B981", # Green
                    related_entity_type="ORDER",
                    related_entity_id=ord.id,
                    details=order_details
                ))

        # Milestone 5: DELIVERED (Teal / Muted Green)
        elif ord.order_status == "Delivered" and start_dt <= delivery_dt <= end_dt:
            if not types_set or "DELIVERED" in types_set:
                events.append(CalendarEventResponse(
                    id=f"order-delivered-{ord.id}",
                    event_type="DELIVERED",
                    title=f"🟢 Delivered {ord.order_number}",
                    subtitle=client_name,
                    description=f"Delivered successfully",
                    start_datetime=delivery_dt,
                    end_datetime=delivery_dt,
                    all_day=False,
                    status="Delivered",
                    priority="Normal",
                    color="#0D9488", # Teal / Muted Green
                    related_entity_type="ORDER",
                    related_entity_id=ord.id,
                    details=order_details
                ))

        # Milestone 6: SCHEDULED DELIVERY (Sky / Light Teal)
        elif ord.order_status not in ["Delivered", "Cancelled"] and not is_late and start_dt <= delivery_dt <= end_dt:
            if not types_set or "DELIVERY" in types_set:
                events.append(CalendarEventResponse(
                    id=f"order-delivery-{ord.id}",
                    event_type="DELIVERY",
                    title=f"🩵 Delivery {ord.order_number}",
                    subtitle=f"{client_name} ({ord.delivery_time or '12:00 PM'})",
                    description=f"Address: {ord.delivery_address or 'Store Pickup'}",
                    start_datetime=delivery_dt,
                    end_datetime=delivery_dt,
                    all_day=False,
                    status=ord.order_status,
                    priority="Normal",
                    color="#06B6D4", # Sky / Light Teal
                    related_entity_type="ORDER",
                    related_entity_id=ord.id,
                    details=order_details
                ))

    # -------------------------------------------------------------
    # 2. STOCK ACTIVITY (Yellow / Amber)
    # -------------------------------------------------------------
    if can_view_inventory and (not types_set or "STOCK" in types_set):
        tx_query = db.query(InventoryTransaction).options(joinedload(InventoryTransaction.ingredient)).filter(
            and_(InventoryTransaction.created_at >= start_dt, InventoryTransaction.created_at <= end_dt)
        )
        if search:
            tx_query = tx_query.join(Ingredient).filter(Ingredient.name.ilike(f"%{search}%"))

        transactions = tx_query.order_by(InventoryTransaction.created_at.desc()).all()

        for tx in transactions:
            ing_name = tx.ingredient.name if tx.ingredient else "Item"
            unit = tx.ingredient.unit if tx.ingredient else "units"
            qty_change = float(tx.quantity_change or 0.0)
            qty_str = f"+{qty_change:g}" if qty_change > 0 else f"{qty_change:g}"
            
            unit_cost = float(tx.unit_cost_at_time or (tx.ingredient.unit_cost if tx.ingredient else 0.0))
            total_val = abs(qty_change) * unit_cost
            tx_type = tx.type or "ADJUSTMENT"

            events.append(CalendarEventResponse(
                id=f"stock-{tx.id}",
                event_type="STOCK",
                title=f"🟡 Stock {ing_name}",
                subtitle=f"{tx_type.replace('_', ' ').title()}: {qty_str} {unit}",
                description=f"Valuation: ₹{total_val:,.2f} (@ ₹{unit_cost}/unit)",
                start_datetime=tx.created_at,
                end_datetime=tx.created_at,
                all_day=True,
                status=tx_type,
                priority="Normal",
                color="#F59E0B", # Yellow / Amber
                related_entity_type="INVENTORY_TRANSACTION",
                related_entity_id=tx.id,
                details={
                    "transaction_id": tx.id,
                    "ingredient_id": tx.ingredient_id,
                    "ingredient_name": ing_name,
                    "transaction_type": tx_type,
                    "quantity_change": qty_change,
                    "quantity_str": qty_str,
                    "unit": unit,
                    "unit_cost": unit_cost,
                    "total_value": total_val,
                    "supplier": tx.ingredient.supplier if tx.ingredient else None,
                    "notes": tx.notes,
                    "created_at": tx.created_at.isoformat()
                }
            ))

    # -------------------------------------------------------------
    # 3. CUSTOM OPERATIONAL NOTES (Purple)
    # -------------------------------------------------------------
    if not types_set or "NOTE" in types_set:
        note_query = db.query(CalendarNote).filter(
            and_(CalendarNote.start_datetime >= start_dt, CalendarNote.start_datetime <= end_dt)
        )
        if search:
            note_query = note_query.filter(
                or_(CalendarNote.title.ilike(f"%{search}%"), CalendarNote.description.ilike(f"%{search}%"))
            )
        if priority_filter:
            note_query = note_query.filter(CalendarNote.priority == priority_filter)

        notes = note_query.all()
        for n in notes:
            status_text = "Completed" if n.is_completed else "Active"
            events.append(CalendarEventResponse(
                id=f"note-{n.id}",
                event_type="NOTE",
                title=f"🟣 Note: {n.title}",
                subtitle=f"Priority: {n.priority} ({status_text})",
                description=n.description or "No description",
                start_datetime=n.start_datetime,
                end_datetime=n.end_datetime,
                all_day=n.all_day,
                status=status_text,
                priority=n.priority,
                color=n.color or "#8B5CF6", # Purple
                related_entity_type="CALENDAR_NOTE",
                related_entity_id=n.id,
                details={
                    "note_id": n.id,
                    "title": n.title,
                    "description": n.description,
                    "start_datetime": n.start_datetime.isoformat(),
                    "end_datetime": n.end_datetime.isoformat() if n.end_datetime else None,
                    "all_day": n.all_day,
                    "priority": n.priority,
                    "is_completed": n.is_completed,
                    "created_by_id": n.created_by_id
                }
            ))

    # Sort events by visual priority (Late > Making > New Order > Ready > Delivery > Delivered > Stock > Notes)
    priority_map = {
        "LATE": 1,
        "MAKING": 2,
        "NEW_ORDER": 3,
        "READY": 4,
        "DELIVERY": 5,
        "DELIVERED": 6,
        "STOCK": 7,
        "NOTE": 8
    }
    events.sort(key=lambda x: (priority_map.get(x.event_type, 9), x.start_datetime))
    return events

@router.get("/summary", response_model=CalendarSummaryResponse)
def get_calendar_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("CALENDAR_VIEW"))
):
    now_utc = datetime.utcnow()
    today_start = datetime.combine(now_utc.date(), time.min)
    today_end = datetime.combine(now_utc.date(), time.max)

    # Today's New Orders
    new_orders = db.query(func.count(Order.id)).filter(
        and_(Order.order_date >= today_start, Order.order_date <= today_end)
    ).scalar() or 0

    # Today's Making
    making = db.query(func.count(Order.id)).filter(
        and_(
            Order.order_status.in_(["Preparing", "Baking", "Decorating"]),
            or_(
                and_(Order.production_date >= today_start, Order.production_date <= today_end),
                Order.order_status.in_(["Preparing", "Baking", "Decorating"])
            )
        )
    ).scalar() or 0

    # Today's Ready
    ready = db.query(func.count(Order.id)).filter(
        and_(Order.order_status == "Ready", Order.delivery_date >= today_start, Order.delivery_date <= today_end)
    ).scalar() or 0

    # Today's Scheduled Deliveries
    deliveries_scheduled = db.query(func.count(Order.id)).filter(
        and_(Order.delivery_date >= today_start, Order.delivery_date <= today_end, Order.order_status != "Cancelled")
    ).scalar() or 0

    # Today's Completed Deliveries
    deliveries_completed = db.query(func.count(Order.id)).filter(
        and_(Order.delivery_date >= today_start, Order.delivery_date <= today_end, Order.order_status == "Delivered")
    ).scalar() or 0

    # Active Overdue/Late Deliveries
    late_overdue = db.query(func.count(Order.id)).filter(
        and_(
            Order.delivery_date < now_utc,
            Order.order_status.not_in(["Delivered", "Cancelled"])
        )
    ).scalar() or 0

    # Today's Stock Updates
    stock_updates = db.query(func.count(InventoryTransaction.id)).filter(
        and_(InventoryTransaction.created_at >= today_start, InventoryTransaction.created_at <= today_end)
    ).scalar() or 0

    # Today's Notes
    notes_today = db.query(func.count(CalendarNote.id)).filter(
        and_(CalendarNote.start_datetime >= today_start, CalendarNote.start_datetime <= today_end)
    ).scalar() or 0

    return CalendarSummaryResponse(
        new_orders_today=new_orders,
        making_today=making,
        ready_today=ready,
        deliveries_scheduled_today=deliveries_scheduled,
        deliveries_completed_today=deliveries_completed,
        late_overdue_today=late_overdue,
        stock_updates_today=stock_updates,
        notes_today=notes_today
    )

# -------------------------------------------------------------
# CALENDAR NOTES ENDPOINTS
# -------------------------------------------------------------
@router.post("/notes", response_model=CalendarNoteResponse, status_code=status.HTTP_201_CREATED)
def create_calendar_note(
    payload: CalendarNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("CALENDAR_VIEW"))
):
    note = CalendarNote(
        title=payload.title,
        description=payload.description,
        start_datetime=payload.start_datetime,
        end_datetime=payload.end_datetime,
        all_day=payload.all_day,
        priority=payload.priority or "Normal",
        color=payload.color or "#8B5CF6",
        created_by_id=current_user.id
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    log_audit_action(
        db, "NOTE_CREATE", "CalendarNote", str(note.id),
        {"title": note.title, "date": note.start_datetime.isoformat()}, current_user
    )
    return note

@router.put("/notes/{note_id}", response_model=CalendarNoteResponse)
def update_calendar_note(
    note_id: int,
    payload: CalendarNoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("CALENDAR_VIEW"))
):
    note = db.query(CalendarNote).filter(CalendarNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Calendar note not found")

    old_vals = {"title": note.title, "is_completed": note.is_completed, "date": note.start_datetime.isoformat()}

    if payload.title is not None:
        note.title = payload.title
    if payload.description is not None:
        note.description = payload.description
    if payload.start_datetime is not None:
        note.start_datetime = payload.start_datetime
    if payload.end_datetime is not None:
        note.end_datetime = payload.end_datetime
    if payload.all_day is not None:
        note.all_day = payload.all_day
    if payload.priority is not None:
        note.priority = payload.priority
    if payload.color is not None:
        note.color = payload.color
    if payload.is_completed is not None:
        note.is_completed = payload.is_completed

    db.commit()
    db.refresh(note)

    log_audit_action(
        db, "NOTE_EDIT", "CalendarNote", str(note.id),
        {"old": old_vals, "new": {"title": note.title, "is_completed": note.is_completed}}, current_user
    )
    return note

@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_calendar_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("CALENDAR_VIEW"))
):
    note = db.query(CalendarNote).filter(CalendarNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Calendar note not found")

    title = note.title
    db.delete(note)
    db.commit()

    log_audit_action(db, "NOTE_DELETE", "CalendarNote", str(note_id), {"title": title}, current_user)
    return None

# -------------------------------------------------------------
# ATOMIC RESCHEDULING ENDPOINT
# -------------------------------------------------------------
@router.post("/reschedule", status_code=status.HTTP_200_OK)
def reschedule_calendar_event(
    payload: CalendarRescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("CALENDAR_VIEW"))
):
    effective_perms = get_user_effective_permissions(current_user, db)

    if payload.entity_type == "ORDER_DELIVERY":
        can_reschedule = "ORDER_DELIVERY_RESCHEDULE" in effective_perms or "CALENDAR_EDIT" in effective_perms or current_user.is_superadmin
        if not can_reschedule:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not have permission to reschedule order delivery dates."
            )

        order = db.query(Order).filter(Order.id == payload.entity_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        old_dt = order.delivery_date.isoformat()
        order.delivery_date = payload.new_start_datetime
        db.commit()

        log_audit_action(
            db, "ORDER_DELIVERY_RESCHEDULE", "Order", str(order.id),
            {"old_delivery_date": old_dt, "new_delivery_date": payload.new_start_datetime.isoformat()}, current_user
        )
        return {"message": f"Order {order.order_number} delivery date updated successfully", "new_date": payload.new_start_datetime}

    elif payload.entity_type == "PRODUCTION":
        prod = db.query(Production).filter(Production.id == payload.entity_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail="Production task not found")

        can_reschedule = (
            "PRODUCTION_RESCHEDULE" in effective_perms or
            "PRODUCTION_EDIT_ALL" in effective_perms or
            "CALENDAR_EDIT" in effective_perms or
            current_user.is_superadmin or
            ("PRODUCTION_EDIT_OWN" in effective_perms and prod.assigned_to_id == current_user.id)
        )
        if not can_reschedule:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not have permission to reschedule this production task."
            )

        old_dt = prod.production_date.isoformat()
        prod.production_date = payload.new_start_datetime
        
        # Also update parent order's production_date for consistency
        if prod.order:
            prod.order.production_date = payload.new_start_datetime

        db.commit()

        log_audit_action(
            db, "PRODUCTION_RESCHEDULE", "Production", str(prod.id),
            {"old_production_date": old_dt, "new_production_date": payload.new_start_datetime.isoformat()}, current_user
        )
        return {"message": "Production schedule updated successfully", "new_date": payload.new_start_datetime}

    elif payload.entity_type == "CALENDAR_NOTE":
        can_reschedule = "NOTE_EDIT" in effective_perms or "CALENDAR_EDIT" in effective_perms or current_user.is_superadmin
        if not can_reschedule:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not have permission to edit calendar notes."
            )

        note = db.query(CalendarNote).filter(CalendarNote.id == payload.entity_id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Calendar note not found")

        old_dt = note.start_datetime.isoformat()
        note.start_datetime = payload.new_start_datetime
        if payload.new_end_datetime:
            note.end_datetime = payload.new_end_datetime

        db.commit()

        log_audit_action(
            db, "NOTE_EDIT", "CalendarNote", str(note.id),
            {"old_start": old_dt, "new_start": payload.new_start_datetime.isoformat()}, current_user
        )
        return {"message": "Note rescheduled successfully", "new_date": payload.new_start_datetime}

    else:
        raise HTTPException(status_code=400, detail="Invalid reschedule entity type")
