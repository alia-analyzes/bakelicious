from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.database.connection import get_db
from app.models.setting import Setting
from app.schemas.setting import SettingUpdate, SettingResponse
from app.models.user import User
from app.auth.permissions import require_permission
from app.services.audit_service import log_audit_action

router = APIRouter(prefix="/settings", tags=["Settings"])

DEFAULT_SETTINGS = {
    "business_name": "Bakelicious",
    "business_tagline": "Fresh & Delicious Bakery",
    "business_phone": "+91 98765 43210",
    "business_email": "contact@bakelicious.com",
    "business_address": "123 Baker Street, Foodie Nagar, City",
    "currency_symbol": "₹",
    "currency_code": "INR",
    "tax_rate_percent": 5.0,
    "auto_inventory_deduct": True,
    "logo_url": "/logo.png"
}

@router.get("", response_model=Dict[str, Any])
def get_settings(db: Session = Depends(get_db)):
    """Public & ERP: returns current store settings."""
    settings_records = db.query(Setting).all()
    result = DEFAULT_SETTINGS.copy()
    for s in settings_records:
        result[s.key] = s.value
    return result

@router.put("", response_model=Dict[str, Any])
def update_setting(
    payload: SettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("SETTINGS_EDIT"))
):
    setting = db.query(Setting).filter(Setting.key == payload.key).first()
    if setting:
        setting.value = payload.value
    else:
        setting = Setting(key=payload.key, value=payload.value)
        db.add(setting)
        
    db.commit()
    log_audit_action(db, "SETTING_UPDATE", "Setting", payload.key, {"key": payload.key, "value": payload.value}, current_user)
    return get_settings(db)
