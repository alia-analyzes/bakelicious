from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DashboardSummary(BaseModel):
    todays_orders_count: int = 0
    today_orders_count: int = 0
    todays_revenue: float = 0.0
    today_revenue: float = 0.0
    pending_orders_count: int = 0
    orders_ready_count: int = 0
    orders_delivered_count: int = 0
    outstanding_payments: float = 0.0
    low_stock_items_count: int = 0
    low_stock_count: int = 0
    monthly_revenue: float = 0.0
    monthly_costs: float = 0.0
    monthly_expenses: float = 0.0
    monthly_profit: float = 0.0
    monthly_net_profit: float = 0.0
    monthly_profit_margin: float = 0.0
    gross_profit: float = 0.0
    net_profit: float = 0.0
    in_production_count: int = 0

class AnalyticsSummary(BaseModel):
    total_revenue: float = 0.0
    total_orders: int = 0
    total_cost: float = 0.0
    total_expenses: float = 0.0
    gross_profit: float = 0.0
    net_profit: float = 0.0
    avg_order_value: float = 0.0
    profit_margin: float = 0.0

class ChartDataPoint(BaseModel):
    date: str
    revenue: float = 0.0
    orders: int = 0
    expenses: float = 0.0
    cost: float = 0.0
    profit: float = 0.0

class AnalyticsOverview(BaseModel):
    period: str
    summary: Dict[str, Any]
    trend: List[ChartDataPoint]
    top_products: List[Dict[str, Any]]
    expense_breakdown: List[Dict[str, Any]]
