import uuid
from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.order import Order, OrderItem
from app.models.client import Client
from app.models.product import Product
from app.models.production import Production
from app.schemas.order import OrderCreate, PublicOrderCreate, OrderStatusUpdate, OrderResponse
from app.auth.jwt import get_current_user
from app.models.user import User
from app.auth.permissions import require_permission, require_any_permission
from app.services.inventory_service import deduct_inventory_for_order
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/orders", tags=["Orders"])

def format_order_response(order: Order) -> dict:
    return {
        "id": order.id,
        "order_number": order.order_number,
        "client_id": order.client_id,
        "order_date": order.order_date,
        "delivery_date": order.delivery_date,
        "delivery_time": order.delivery_time,
        "production_date": order.production_date,
        "subtotal": float(order.subtotal or 0.0),
        "discount": float(order.discount or 0.0),
        "final_amount": float(order.final_amount or 0.0),
        "advance_paid": float(order.advance_paid or 0.0),
        "remaining_paid": float(order.remaining_paid or 0.0),
        "payment_status": order.payment_status,
        "order_status": order.order_status,
        "special_instructions": order.special_instructions,
        "delivery_address": order.delivery_address,
        "notes": order.notes,
        "inventory_deducted": order.inventory_deducted,
        "client": order.client,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "size_override": item.size_override,
                "unit_price": float(item.unit_price or 0.0),
                "subtotal": float(item.subtotal or 0.0),
                "notes": item.notes,
                "product": item.product
            }
            for item in order.items
        ],
        "created_at": order.created_at,
        "updated_at": order.updated_at
    }

@router.get("", response_model=List[OrderResponse])
def get_orders(
    status: Optional[str] = None,
    client_id: Optional[int] = None,
    payment_status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ORDERS_VIEW"))
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.order_status == status)
    if client_id:
        query = query.filter(Order.client_id == client_id)
    if payment_status:
        query = query.filter(Order.payment_status == payment_status)
    if search:
        query = query.filter(
            (Order.order_number.ilike(f"%{search}%")) |
            (Order.delivery_address.ilike(f"%{search}%"))
        )
        
    orders = query.order_by(Order.delivery_date.desc(), Order.id.desc()).all()
    return [format_order_response(o) for o in orders]

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ORDERS_VIEW"))
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return format_order_response(order)

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ORDERS_CREATE"))
):
    client = db.query(Client).filter(Client.id == payload.client_id, Client.is_deleted == False).first()
    if not client:
        raise HTTPException(status_code=400, detail="Client not found")
        
    if not payload.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    calculated_subtotal = Decimal("0.00")
    order_items_to_create = []

    for item in payload.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Product quantity must be greater than zero")
            
        product = db.query(Product).filter(Product.id == item.product_id, Product.is_deleted == False).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Product ID {item.product_id} not found")
            
        price = Decimal(str(item.unit_price)) if item.unit_price is not None else Decimal(str(product.price))
        if price < 0:
            raise HTTPException(status_code=400, detail="Unit price cannot be negative")
            
        item_subtotal = price * Decimal(str(item.quantity))
        calculated_subtotal += item_subtotal
        
        order_items_to_create.append({
            "product_id": product.id,
            "quantity": item.quantity,
            "size_override": item.size_override or product.size,
            "unit_price": price,
            "subtotal": item_subtotal,
            "notes": item.notes
        })

    discount = Decimal(str(max(0.0, payload.discount)))
    if discount > calculated_subtotal:
        raise HTTPException(status_code=400, detail="Discount cannot exceed subtotal amount")
        
    final_amount = calculated_subtotal - discount
    advance = Decimal(str(max(0.0, payload.advance_paid)))
    
    if advance > final_amount:
        raise HTTPException(status_code=400, detail="Advance payment cannot exceed final amount")
        
    remaining = final_amount - advance
    
    payment_status = "Pending"
    if remaining == Decimal("0.00") and final_amount > Decimal("0.00"):
        payment_status = "Paid"
    elif advance > Decimal("0.00"):
        payment_status = "Partial"

    order_number = f"ORD-{db.query(Order).count() + 1001}"

    order = Order(
        order_number=order_number,
        client_id=client.id,
        order_date=datetime.utcnow(),
        delivery_date=payload.delivery_date,
        delivery_time=payload.delivery_time or "12:00 PM",
        production_date=payload.production_date or payload.delivery_date,
        subtotal=calculated_subtotal,
        discount=discount,
        final_amount=final_amount,
        advance_paid=advance,
        remaining_paid=remaining,
        payment_status=payment_status,
        order_status="Received",
        special_instructions=payload.special_instructions,
        delivery_address=payload.delivery_address or client.address,
        notes=payload.notes
    )
    db.add(order)
    db.flush()

    for item_data in order_items_to_create:
        o_item = OrderItem(order_id=order.id, **item_data)
        db.add(o_item)

    # Create associated Production record
    prod = Production(
        order_id=order.id,
        production_date=order.production_date or order.delivery_date,
        delivery_date=order.delivery_date,
        status="Not Started",
        notes=payload.notes
    )
    db.add(prod)

    db.commit()
    db.refresh(order)

    log_audit_action(db, "ORDER_CREATE", "Order", str(order.id), {"order_number": order.order_number, "final_amount": float(final_amount)}, current_user)
    return format_order_response(order)

@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ORDERS_STATUS_UPDATE"))
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if payload.order_status:
        order.order_status = payload.order_status
        if order.production:
            if payload.order_status in ["Preparing", "Baking", "Decorating", "Ready"]:
                order.production.status = payload.order_status
            elif payload.order_status == "Delivered":
                order.production.status = "Completed"

    if payload.advance_paid is not None:
        new_advance = Decimal(str(max(0.0, payload.advance_paid)))
        if new_advance > order.final_amount:
            raise HTTPException(status_code=400, detail="Advance payment cannot exceed final amount")
        order.advance_paid = new_advance
        order.remaining_paid = order.final_amount - new_advance
        
        if order.remaining_paid == Decimal("0.00"):
            order.payment_status = "Paid"
        elif order.advance_paid > Decimal("0.00"):
            order.payment_status = "Partial"
        else:
            order.payment_status = "Pending"

    if payload.payment_status:
        order.payment_status = payload.payment_status
        if payload.payment_status == "Paid":
            order.advance_paid = order.final_amount
            order.remaining_paid = Decimal("0.00")

    if order.order_status == "Delivered":
        deduct_inventory_for_order(order, db)

    db.commit()
    db.refresh(order)

    log_audit_action(db, "ORDER_STATUS_UPDATE", "Order", str(order.id), {"order_status": order.order_status, "payment_status": order.payment_status}, current_user)
    return format_order_response(order)

@router.delete("/{order_id}", response_model=OrderResponse)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ORDERS_DELETE"))
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.order_status = "Cancelled"
    if order.production:
        order.production.status = "Completed"
        
    db.commit()
    db.refresh(order)

    log_audit_action(db, "ORDER_CANCEL", "Order", str(order.id), {"order_number": order.order_number}, current_user)
    return format_order_response(order)

@router.post("/public", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_public_order(
    payload: PublicOrderCreate,
    db: Session = Depends(get_db)
):
    """Public customer enquiry and order placement endpoint (Unauthenticated)."""
    if not payload.customer_name or not payload.phone:
        raise HTTPException(status_code=400, detail="Customer name and phone number are required")

    # Find or create Client
    client = db.query(Client).filter(Client.phone == payload.phone, Client.is_deleted == False).first()
    if not client:
        client = Client(
            name=payload.customer_name,
            phone=payload.phone,
            email=payload.email,
            address=payload.delivery_address or "Kolkata Customer Address",
            notes="Web Order Customer"
        )
        db.add(client)
        db.flush()

    subtotal = Decimal("0.00")
    order_items_to_create = []

    if payload.product_id:
        product = db.query(Product).filter(Product.id == payload.product_id, Product.is_deleted == False).first()
        if product:
            unit_price = Decimal(str(product.price or 0.0))
            if payload.size_override and product.sizes:
                for sz in product.sizes:
                    if isinstance(sz, dict) and sz.get("size") == payload.size_override:
                        unit_price = Decimal(str(sz.get("selling_price", product.price)))
                        break
            
            qty = max(1, payload.quantity)
            item_subtotal = unit_price * Decimal(str(qty))
            subtotal += item_subtotal

            order_items_to_create.append({
                "product_id": product.id,
                "quantity": qty,
                "size_override": payload.size_override or product.size,
                "unit_price": unit_price,
                "subtotal": item_subtotal,
                "notes": payload.special_instructions
            })

    order_number = f"ORD-{db.query(Order).count() + 1001}"
    delivery_date_val = datetime.utcnow()
    if payload.delivery_date:
        try:
            delivery_date_val = datetime.fromisoformat(payload.delivery_date.replace("Z", "+00:00"))
        except Exception:
            delivery_date_val = datetime.utcnow()

    order = Order(
        order_number=order_number,
        client_id=client.id,
        order_date=datetime.utcnow(),
        delivery_date=delivery_date_val,
        delivery_time="12:00 PM",
        production_date=delivery_date_val,
        subtotal=subtotal,
        discount=Decimal("0.00"),
        final_amount=subtotal,
        advance_paid=Decimal("0.00"),
        remaining_paid=subtotal,
        payment_status="Pending",
        order_status="Received",
        special_instructions=payload.special_instructions,
        delivery_address=payload.delivery_address or client.address,
        notes=f"Public Website Enquiry. Notes: {payload.special_instructions or 'None'}"
    )
    db.add(order)
    db.flush()

    for item_data in order_items_to_create:
        db.add(OrderItem(order_id=order.id, **item_data))

    prod = Production(
        order_id=order.id,
        production_date=delivery_date_val,
        delivery_date=delivery_date_val,
        status="Not Started",
        notes=f"Website order for {client.name}"
    )
    db.add(prod)

    db.commit()
    db.refresh(order)
    return format_order_response(order)
