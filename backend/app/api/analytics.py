from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.ingredient import Ingredient
from app.models.expense import Expense
from app.services.costing import calculate_product_cost
from app.schemas.analytics import AnalyticsOverview, DashboardSummary
from app.auth.jwt import get_current_user
from app.models.user import User
from app.auth.permissions import get_user_effective_permissions, require_any_permission

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
        s = datetime.strptime(start_date, "%Y-%m-%d")
        e = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1) - timedelta(seconds=1)
        return s, e

    return today_start - timedelta(days=30), now

@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_perms = get_user_effective_permissions(current_user, db)
    can_view_analytics = current_user.is_superadmin or "ANALYTICS_VIEW" in user_perms or "ORDERS_VIEW" in user_perms
    can_view_revenue = current_user.is_superadmin or "REVENUE_VIEW" in user_perms
    can_view_profit = current_user.is_superadmin or "PROFIT_VIEW" in user_perms
    can_view_expenses = current_user.is_superadmin or "EXPENSES_VIEW" in user_perms

    if not can_view_analytics and not can_view_revenue:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to view ERP dashboard analytics."
        )

    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day)
    first_this_month = datetime(now.year, now.month, 1)

    # Today's metrics
    todays_orders = db.query(Order).filter(Order.order_date >= today_start, Order.order_status != "Cancelled").all()
    todays_orders_count = len(todays_orders)
    todays_revenue = sum(float(o.final_amount or 0.0) for o in todays_orders) if can_view_revenue else 0.0

    # Active order statuses
    pending_orders_count = db.query(Order).filter(Order.order_status.in_(["Received", "Confirmed", "Preparing", "Baking", "Decorating"])).count()
    orders_ready_count = db.query(Order).filter(Order.order_status == "Ready").count()
    orders_delivered_count = db.query(Order).filter(Order.order_date >= today_start, Order.order_status == "Delivered").count()

    # Outstanding Payments
    unpaid_orders = db.query(Order).filter(Order.payment_status.in_(["Pending", "Partial"]), Order.order_status != "Cancelled").all()
    outstanding_payments = sum(float(o.remaining_paid or 0.0) for o in unpaid_orders) if can_view_revenue else 0.0

    # Low stock ingredients count
    ingredients = db.query(Ingredient).filter(Ingredient.is_deleted == False).all()
    low_stock_items_count = sum(1 for i in ingredients if float(i.quantity or 0.0) <= float(i.min_stock or 0.0))

    # Monthly financial stats
    monthly_orders = db.query(Order).filter(Order.order_date >= first_this_month, Order.order_status != "Cancelled").all()
    monthly_revenue = sum(float(o.final_amount or 0.0) for o in monthly_orders) if can_view_revenue else 0.0

    # Calculate monthly product costs
    monthly_costs = 0.0
    if can_view_profit:
        for order in monthly_orders:
            for item in order.items:
                if item.product:
                    cost_info = calculate_product_cost(item.product, db)
                    monthly_costs += cost_info["effective_cost"] * item.quantity

    # Monthly operational expenses
    monthly_expenses = 0.0
    if can_view_expenses or can_view_profit:
        expenses = db.query(Expense).filter(Expense.expense_date >= first_this_month).all()
        monthly_expenses = sum(float(e.amount or 0.0) for e in expenses)

    # Active production queue count
    in_production_count = db.query(Order).filter(Order.order_status.in_(["Preparing", "Baking", "Decorating"])).count()

    gross_profit = round((monthly_revenue - monthly_costs), 2) if can_view_profit else 0.0
    net_profit = round((gross_profit - monthly_expenses), 2) if can_view_profit else 0.0
    monthly_profit_margin = round(((net_profit / monthly_revenue) * 100), 1) if (monthly_revenue > 0 and can_view_profit) else 0.0

    return {
        "todays_orders_count": todays_orders_count,
        "today_orders_count": todays_orders_count,
        "todays_revenue": todays_revenue,
        "today_revenue": todays_revenue,
        "pending_orders_count": pending_orders_count,
        "orders_ready_count": orders_ready_count,
        "orders_delivered_count": orders_delivered_count,
        "outstanding_payments": outstanding_payments,
        "low_stock_items_count": low_stock_items_count,
        "low_stock_count": low_stock_items_count,
        "monthly_revenue": monthly_revenue,
        "monthly_costs": monthly_costs,
        "monthly_expenses": monthly_expenses,
        "monthly_profit": net_profit,
        "monthly_net_profit": net_profit,
        "monthly_profit_margin": monthly_profit_margin,
        "gross_profit": gross_profit,
        "net_profit": net_profit,
        "in_production_count": in_production_count
    }

@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    period: str = Query("this_month", description="today, this_week, last_week, this_month, last_month, custom"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_perms = get_user_effective_permissions(current_user, db)
    can_view_analytics = current_user.is_superadmin or "ANALYTICS_VIEW" in user_perms
    can_view_revenue = current_user.is_superadmin or "REVENUE_VIEW" in user_perms
    can_view_profit = current_user.is_superadmin or "PROFIT_VIEW" in user_perms
    can_view_expenses = current_user.is_superadmin or "EXPENSES_VIEW" in user_perms

    if not can_view_analytics and not can_view_revenue:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to view business analytics overview."
        )

    s_date, e_date = get_date_range(period, start_date, end_date)

    orders = db.query(Order).filter(
        Order.order_date >= s_date,
        Order.order_date <= e_date,
        Order.order_status != "Cancelled"
    ).all()

    expenses = db.query(Expense).filter(
        Expense.expense_date >= s_date,
        Expense.expense_date <= e_date
    ).all() if (can_view_expenses or can_view_profit) else []

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
            if can_view_revenue:
                trend_dict[d_str]["revenue"] += float(o.final_amount or 0.0)
            trend_dict[d_str]["orders"] += 1
            if can_view_profit:
                for item in o.items:
                    if item.product:
                        c_info = calculate_product_cost(item.product, db)
                        trend_dict[d_str]["cost"] += c_info["effective_cost"] * item.quantity

    for e in expenses:
        d_str = e.expense_date.strftime("%d %b")
        if d_str in trend_dict:
            trend_dict[d_str]["expenses"] += float(e.amount or 0.0)

    trend_list = []
    total_revenue = 0.0
    total_orders = 0
    total_cost = 0.0
    total_expenses = 0.0

    for d_str, val in trend_dict.items():
        val["profit"] = (val["revenue"] - val["cost"] - val["expenses"]) if can_view_profit else 0.0
        trend_list.append({
            "date": d_str,
            "revenue": round(val["revenue"], 2),
            "orders": val["orders"],
            "expenses": round(val["expenses"], 2),
            "cost": round(val["cost"], 2),
            "profit": round(val["profit"], 2)
        })
        total_revenue += val["revenue"]
        total_orders += val["orders"]
        total_cost += val["cost"]
        total_expenses += val["expenses"]

    gross_profit = (total_revenue - total_cost) if can_view_profit else 0.0
    net_profit = (gross_profit - total_expenses) if can_view_profit else 0.0
    avg_order_value = (total_revenue / total_orders) if (total_orders > 0 and can_view_revenue) else 0.0
    profit_margin = ((net_profit / total_revenue) * 100) if (total_revenue > 0 and can_view_profit) else 0.0

    summary = {
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "total_cost": round(total_cost, 2),
        "total_expenses": round(total_expenses, 2),
        "gross_profit": round(gross_profit, 2),
        "net_profit": round(net_profit, 2),
        "avg_order_value": round(avg_order_value, 2),
        "profit_margin": round(profit_margin, 2)
    }

    # Best-selling products
    prod_sales: Dict[int, Dict[str, Any]] = {}
    for o in orders:
        for item in o.items:
            if item.product:
                pid = item.product_id
                if pid not in prod_sales:
                    prod_sales[pid] = {
                        "product_id": pid,
                        "product_name": item.product.name,
                        "category_name": item.product.category.name if item.product.category else "Uncategorized",
                        "orders_count": 0,
                        "quantity_sold": 0,
                        "revenue": 0.0
                    }
                prod_sales[pid]["orders_count"] += 1
                prod_sales[pid]["quantity_sold"] += item.quantity
                if can_view_revenue:
                    prod_sales[pid]["revenue"] += float(item.subtotal or 0.0)

    top_products = sorted(list(prod_sales.values()), key=lambda x: x["revenue"], reverse=True)[:5]

    # Expense breakdown by category
    expense_breakdown = []
    if can_view_expenses or can_view_profit:
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
