import os
from datetime import datetime
from fastapi import APIRouter, Depends, Response, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.api.analytics import get_analytics_overview
from app.services.report_service import generate_pdf_report, generate_csv_report
from app.models.order import Order
from app.auth.jwt import get_current_user
from app.models.user import User
from app.auth.permissions import require_permission, require_any_permission

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/pdf")
def export_pdf_report(
    period: str = "this_month",
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_permission(["FINANCIAL_REPORTS_VIEW", "REPORTS_GENERATE"]))
):
    overview = get_analytics_overview(period, start_date, end_date, db, current_user)
    logo_path = os.path.join(os.getcwd(), "uploads", "logo.png")

    pdf_bytes = generate_pdf_report(overview, logo_path)

    filename = f"Bakelicious_Report_{period}_{datetime.now().strftime('%Y%m%d')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/csv")
def export_csv_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_permission(["REPORTS_GENERATE", "ORDERS_VIEW"]))
):
    orders = db.query(Order).order_by(Order.order_date.desc()).all()
    orders_list = [
        {
            "order_number": o.order_number,
            "client_name": o.client.name if o.client else "N/A",
            "delivery_date": o.delivery_date.strftime("%Y-%m-%d"),
            "order_status": o.order_status,
            "payment_status": o.payment_status,
            "subtotal": float(o.subtotal or 0.0),
            "discount": float(o.discount or 0.0),
            "final_amount": float(o.final_amount or 0.0),
            "advance_paid": float(o.advance_paid or 0.0),
            "remaining_paid": float(o.remaining_paid or 0.0)
        }
        for o in orders
    ]

    csv_data = generate_csv_report(orders_list)
    filename = f"Bakelicious_Orders_{datetime.now().strftime('%Y%m%d')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
