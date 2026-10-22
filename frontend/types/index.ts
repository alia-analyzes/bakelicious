export interface Permission {
  id: number;
  code: string;
  name: string;
  description?: string;
  module: string;
  action?: string;
}

export interface PermissionOverride {
  code: string;
  name?: string;
  module?: string;
  effect: 'GRANT' | 'DENY';
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  is_system_role: boolean;
  created_at: string;
  permissions: Permission[];
  user_count?: number;
}

export interface UserSession {
  id: number;
  session_id: string;
  created_at: string;
  expires_at: string;
  last_used_at: string;
  revoked_at?: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
}

export interface BakerSummary {
  id: number;
  username: string;
  full_name?: string;
  email: string;
  is_active: boolean;
  active_tasks_count: number;
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  role?: string;
  primary_role?: string;
  roles?: string[];
  is_superadmin?: boolean;
  is_active: boolean;
  force_password_change?: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string;
  effective_permissions?: string[];
  permission_overrides?: PermissionOverride[];
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Ingredient {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_stock: number;
  unit_cost: number;
  supplier?: string;
  is_low_stock?: boolean;
  updated_at: string;
}

export interface RecipeItem {
  id?: number;
  ingredient_id: number;
  quantity_required: number;
  quantity?: number;
  unit?: string;
  ingredient?: Ingredient;
}

export interface Recipe {
  id: number;
  product_id: number;
  notes?: string;
  recipe_items: RecipeItem[];
  items?: RecipeItem[];
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  sku?: string;
  description?: string;
  price: number;
  manual_cost?: number | null;
  use_manual_cost: boolean;
  prep_time_hours: number;
  size?: string;
  sizes?: any[];
  featured?: boolean;
  availability: boolean;
  public_visibility?: boolean;
  tags?: string[];
  image_url?: string;
  gallery_images?: string[];
  category?: Category;
  recipe?: Recipe;
  calculated_cost?: number | null;
  effective_cost?: number | null;
  profit?: number | null;
  profit_margin?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  total_orders?: number;
  total_spending?: number;
  last_order_date?: string;
  created_at: string;
}

export interface OrderItem {
  id?: number;
  product_id: number;
  quantity: number;
  size_override?: string;
  unit_price: number;
  subtotal: number;
  notes?: string;
  product?: Product;
}

export interface Order {
  id: number;
  order_number: string;
  client_id: number;
  order_date: string;
  delivery_date: string;
  delivery_time?: string;
  production_date?: string;
  subtotal: number;
  discount: number;
  final_amount: number;
  advance_paid: number;
  remaining_paid: number;
  payment_status: 'Pending' | 'Partial' | 'Paid';
  order_status: 'Received' | 'Confirmed' | 'Preparing' | 'Baking' | 'Decorating' | 'Ready' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  special_instructions?: string;
  delivery_address?: string;
  notes?: string;
  inventory_deducted: boolean;
  client?: Client;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface Production {
  id: number;
  order_id: number;
  production_date: string;
  delivery_date: string;
  status: 'Not Started' | 'Preparing' | 'Baking' | 'Decorating' | 'Quality Check' | 'Ready' | 'Completed';
  priority?: 'Normal' | 'High' | 'Urgent';
  notes?: string;
  assigned_to_id?: number | null;
  assigned_by_id?: number | null;
  assigned_at?: string | null;
  stage_updated_at?: string | null;
  assigned_baker?: {
    id: number;
    username: string;
    full_name?: string;
    email: string;
  } | null;
  order?: Order;
  updated_at: string;
}

export interface InventoryTransaction {
  id: number;
  ingredient_id: number;
  type: string;
  transaction_type?: string;
  quantity_change: number;
  unit_cost_at_time?: number;
  reference_id?: string;
  notes?: string;
  created_at: string;
  ingredient?: Ingredient;
}

export interface Expense {
  id: number;
  name: string;
  category: string;
  amount: number;
  expense_date: string;
  description?: string;
  receipt_url?: string;
  created_at: string;
}

export interface Feedback {
  id: number;
  customer_name: string;
  rating?: number;
  review_text?: string;
  image_url?: string;
  is_screenshot?: boolean;
  is_published?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface DashboardSummary {
  todays_orders_count: number;
  today_orders_count?: number;
  todays_revenue: number;
  today_revenue?: number;
  pending_orders_count: number;
  orders_ready_count: number;
  orders_delivered_count: number;
  outstanding_payments: number;
  low_stock_items_count: number;
  low_stock_count?: number;
  monthly_revenue: number;
  monthly_costs: number;
  monthly_expenses: number;
  monthly_profit: number;
  monthly_net_profit?: number;
  monthly_profit_margin?: number;
  in_production_count?: number;
  gross_profit?: number;
  net_profit?: number;
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
  expenses: number;
  profit: number;
}

export interface AnalyticsOverview {
  period: string;
  summary: DashboardSummary;
  trend: ChartDataPoint[];
  top_products: any[];
  expense_breakdown: any[];
  total_revenue?: number;
  total_orders?: number;
  total_expenses?: number;
  total_profit?: number;
  profit_margin?: number;
  orders_count?: number;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  username?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  resource?: string;
  user?: { username?: string };
  details?: any;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export type CalendarEventType =
  | 'NEW_ORDER'
  | 'MAKING'
  | 'READY'
  | 'DELIVERY'
  | 'DELIVERED'
  | 'LATE'
  | 'STOCK'
  | 'NOTE';

export interface CalendarEvent {
  id: string;
  event_type: CalendarEventType;
  title: string;
  subtitle?: string;
  description?: string;
  start_datetime: string;
  end_datetime?: string;
  all_day: boolean;
  status?: string;
  priority?: 'Normal' | 'High' | 'Urgent';
  color: string;
  related_entity_type: 'ORDER' | 'PRODUCTION' | 'INVENTORY_TRANSACTION' | 'CALENDAR_NOTE';
  related_entity_id: number;
  details: Record<string, any>;
}

export interface CalendarSummary {
  new_orders_today: number;
  making_today: number;
  ready_today: number;
  deliveries_scheduled_today: number;
  deliveries_completed_today: number;
  late_overdue_today: number;
  stock_updates_today: number;
  notes_today: number;
}

export interface CalendarNote {
  id: number;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime?: string;
  all_day: boolean;
  priority: 'Normal' | 'High' | 'Urgent';
  color: string;
  is_completed: boolean;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarReschedulePayload {
  entity_type: 'ORDER_DELIVERY' | 'PRODUCTION' | 'CALENDAR_NOTE';
  entity_id: number;
  new_start_datetime: string;
  new_end_datetime?: string;
}

