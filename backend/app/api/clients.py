from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.models.client import Client
from app.models.order import Order
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
from app.models.user import User
from app.auth.permissions import require_permission
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/clients", tags=["Clients"])

def format_client(client: Client, db: Session) -> dict:
    orders = db.query(Order).filter(Order.client_id == client.id, Order.order_status != "Cancelled").all()
    total_orders = len(orders)
    total_spending = sum(float(o.final_amount or 0.0) for o in orders)

    last_order = db.query(Order).filter(Order.client_id == client.id).order_by(Order.order_date.desc()).first()
    last_order_date = last_order.order_date.strftime("%Y-%m-%d") if last_order else None

    return {
        "id": client.id,
        "name": client.name,
        "phone": client.phone,
        "email": client.email,
        "address": client.address,
        "notes": client.notes,
        "total_orders": total_orders,
        "total_spending": total_spending,
        "last_order_date": last_order_date,
        "created_at": client.created_at
    }

@router.get("", response_model=List[ClientResponse])
def get_clients(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("CLIENTS_VIEW"))
):
    query = db.query(Client).filter(Client.is_deleted == False)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Client.name.ilike(search_term)) | (Client.phone.ilike(search_term)) | (Client.email.ilike(search_term))
        )
    clients = query.order_by(Client.name.asc()).all()
    return [format_client(c, db) for c in clients]

@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("CLIENTS_VIEW"))
):
    client = db.query(Client).filter(Client.id == client_id, Client.is_deleted == False).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return format_client(client, db)

@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    payload: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("CLIENTS_CREATE"))
):
    client = Client(**payload.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    log_audit_action(db, "CLIENT_CREATE", "Client", str(client.id), {"name": client.name}, current_user)
    return format_client(client, db)

@router.put("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: int,
    payload: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("CLIENTS_EDIT"))
):
    client = db.query(Client).filter(Client.id == client_id, Client.is_deleted == False).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(client, key, value)

    db.commit()
    db.refresh(client)
    log_audit_action(db, "CLIENT_UPDATE", "Client", str(client.id), update_data, current_user)
    return format_client(client, db)

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("CLIENTS_DELETE"))
):
    client = db.query(Client).filter(Client.id == client_id, Client.is_deleted == False).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    client.is_deleted = True
    db.commit()
    log_audit_action(db, "CLIENT_DELETE", "Client", str(client_id), {"name": client.name}, current_user)
    return None
