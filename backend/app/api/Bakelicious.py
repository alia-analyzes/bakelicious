from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.ingredient import Ingredient
from app.models.expense import Expense
from app.services.costing import calculate_product_cost
from app.schemas.analytics import AnalyticsOverview, DashboardSummary

router = APIRouter(prefix="/analytics", tags=["Analytics & Dashboard"])

def get_date_range(period: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day)
    
    if period == "today":
        return today_start, now
    elif period == "this_week":
        start = today_start - timedelta(days=today_start.weekday())
        return start, now
    elif period == "last_week":
        start_this_week = today_start - timedelta(days=today_start.weekday())
        start_last_week = start_this_week - timedelta(days=7)
        end_last_week = start_this_week - timedelta(seconds=1)
        return start_last_week, end_last_week
    elif period == "this_month":
        start = datetime(now.year, now.month, 1)
        return start, now
    elif period == "last_month":
        first_this_month = datetime(now.year, now.month, 1)
        last_month_end = first_this_month - timedelta(seconds=1)
        last_month_start = datetime(last_month_end.year, last_month_end.month, 1)
        return last_month_start, last_month_end
    elif period == "custom" and start_date and end_date:
        try:
            s = datetime.strptime(start_date, "%Y-%m-%d")
            e = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            return s, e
        except Exception:
            pass
            
    # Default to this month
    return datetime(now.year, now.month, 1), now

@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day)
    first_this_month = datetime(now.year, now.month, 1)
    
    # Today's metrics
    todays_orders = db.query(Order).filter(Order.order_date >= today_start, Order.order_status != "Cancelled").all()
    todays_orders_count = len(todays_orders)
    todays_revenue = sum(float(o.final_amount or 0.0) for o in todays_orders)
    
    # Active order statuses
    pending_orders_count = db.query(Order).filter(Order.order_status.in_(["Received", "Confirmed", "Preparing", "Baking", "Decorating"])).count()
    orders_ready_count = db.query(Order).filter(Order.order_status == "Ready").count()
    orders_delivered_count = db.query(Order).filter(Order.order_date >= today_start, Order.order_status == "Delivered").count()
    
    # Outstanding Payments
    unpaid_orders = db.query(Order).filter(Order.payment_status.in_(["Pending", "Partial"]), Order.order_status != "Cancelled").all()
    outstanding_payments = sum(float(o.remaining_paid or 0.0) for o in unpaid_orders)
    
    # Low stock ingredients count
    ingredients = db.query(Ingredient).filter(Ingredient.is_deleted == False).all()
    low_stock_items_count = sum(1 for i in ingredients if float(i.quantity or 0.0) <= float(i.min_stock or 0.0))
    
    # Monthly financial stats
    monthly_orders = db.query(Order).filter(Order.order_date >= first_this_month, Order.order_status != "Cancelled").all()
    monthly_revenue = sum(float(o.final_amount or 0.0) for o in monthly_orders)
    
    # Calculate monthly product costs
    monthly_costs = 0.0
    for order in monthly_orders:
        for item in order.items:
            if item.product:
                cost_info = calculate_product_cost(item.product, db)
                monthly_costs += cost_info["effective_cost"] * item.quantity

    # Monthly operational expenses
    expenses = db.query(Expense).filter(Expense.expense_date >= first_this_month).all()
    monthly_expenses = sum(float(e.amount or 0.0) for e in expenses)
    
    monthly_profit = monthly_revenue - (monthly_costs + monthly_expenses)
    
    return {
        "todays_orders_count": todays_orders_count,
        "todays_revenue": todays_revenue,
        "pending_orders_count": pending_orders_count,
        "orders_ready_count": orders_ready_count,
        "orders_delivered_count": orders_delivered_count,
        "outstanding_payments": outstanding_payments,
        "low_stock_items_count": low_stock_items_count,
        "monthly_revenue": monthly_revenue,
        "monthly_costs": monthly_costs,
        "monthly_expenses": monthly_expenses,
        "monthly_profit": monthly_profit
    }

@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    period: str = "this_month",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    s_date, e_date = get_date_range(period, start_date, end_date)
    
    summary = get_dashboard_summary(db)
    
    # Build daily trend chart points for period
    orders = db.query(Order).filter(
        Order.order_date >= s_date,
        Order.order_date <= e_date,
        Order.order_status != "Cancelled"
    ).all()
    
    expenses = db.query(Expense).filter(
        Expense.expense_date >= s_date,
        Expense.expense_date <= e_date
    ).all()
    
    # Group by date string YYYY-MM-DD
    trend_dict: Dict[str, Dict[str, float]] = {}
    
    curr = s_date.date()
    end_curr = e_date.date()
    while curr <= end_curr:
        d_str = curr.strftime("%d %b")
        trend_dict[d_str] = {"revenue": 0.0, "orders": 0, "expenses": 0.0, "cost": 0.0, "profit": 0.0}
        curr += timedelta(days=1)
        
    for o in orders:
        d_str = o.order_date.strftime("%d %b")
        if d_str in trend_dict:
            trend_dict[d_str]["revenue"] += float(o.final_amount or 0.0)
            trend_dict[d_str]["orders"] += 1
            for item in o.items:
                if item.product:
                    c = calculate_product_cost(item.product, db)
                    trend_dict[d_str]["cost"] += c["effective_cost"] * item.quantity

    for e in expenses:
        d_str = e.expense_date.strftime("%d %b")
        if d_str in trend_dict:
            trend_dict[d_str]["expenses"] += float(e.amount or 0.0)
            
    trend_list = []
    for d_str, data in trend_dict.items():
        prof = data["revenue"] - (data["cost"] + data["expenses"])
        trend_list.append({
            "date": d_str,
            "revenue": round(data["revenue"], 2),
            "orders": data["orders"],
            "expenses": round(data["expenses"], 2),
            "profit": round(prof, 2)
        })

    # Top selling products
    prod_sales: Dict[int, Dict[str, Any]] = {}
    for o in orders:
        for item in o.items:
            if item.product:
                pid = item.product.id
                if pid not in prod_sales:
                    prod_sales[pid] = {
                        "id": pid,
                        "name": item.product.name,
                        "category": item.product.category.name if item.product.category else "General",
                        "orders_count": 0,
                        "quantity_sold": 0,
                        "revenue": 0.0
                    }
                prod_sales[pid]["orders_count"] += 1
                prod_sales[pid]["quantity_sold"] += item.quantity
                prod_sales[pid]["revenue"] += float(item.subtotal or 0.0)
                
    top_products = sorted(list(prod_sales.values()), key=lambda x: x["revenue"], reverse=True)[:5]

    # Expense breakdown by category
    exp_cat: Dict[str, float] = {}
    for e in expenses:
        cat = e.category or "Other"
        exp_cat[cat] = exp_cat.get(cat, 0.0) + float(e.amount or 0.0)
        
    expense_breakdown = [{"category": k, "amount": round(v, 2)} for k, v in exp_cat.items()]

    return {
        "period": period,
        "summary": summary,
        "trend": trend_list,
        "top_products": top_products,
        "expense_breakdown": expense_breakdown
    }
