from typing import List, Set, Optional, Callable
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.models.role import Role, Permission, UserRole, UserPermissionOverride
from app.models.production import Production
from app.auth.jwt import get_current_user

# Master list of all standard ERP permissions
PERMISSIONS_DEFINITIONS = [
    # Products
    {"code": "PRODUCTS_VIEW", "name": "View Products", "description": "View products and public catalog data", "module": "Products", "action": "VIEW"},
    {"code": "PRODUCTS_CREATE", "name": "Create Products", "description": "Create new bakery products", "module": "Products", "action": "CREATE"},
    {"code": "PRODUCTS_EDIT", "name": "Edit Products", "description": "Edit product information, sizes, and descriptions", "module": "Products", "action": "EDIT"},
    {"code": "PRODUCTS_DELETE", "name": "Delete Products", "description": "Delete or archive products", "module": "Products", "action": "DELETE"},
    {"code": "PRODUCT_PRICE_EDIT", "name": "Edit Selling Price", "description": "Modify selling prices for products", "module": "Products", "action": "EDIT"},
    {"code": "PRODUCT_COST_VIEW", "name": "View Product Cost", "description": "View ingredient costs, calculated costs, and margins", "module": "Products", "action": "VIEW"},
    {"code": "PRODUCT_COST_EDIT", "name": "Edit Product Cost", "description": "Modify manual product costs and costing formula", "module": "Products", "action": "EDIT"},

    # Categories
    {"code": "CATEGORIES_VIEW", "name": "View Categories", "description": "View product categories", "module": "Categories", "action": "VIEW"},
    {"code": "CATEGORIES_CREATE", "name": "Create Categories", "description": "Add new product categories", "module": "Categories", "action": "CREATE"},
    {"code": "CATEGORIES_EDIT", "name": "Edit Categories", "description": "Edit category details", "module": "Categories", "action": "EDIT"},
    {"code": "CATEGORIES_DELETE", "name": "Delete Categories", "description": "Remove categories", "module": "Categories", "action": "DELETE"},

    # Orders
    {"code": "ORDERS_VIEW", "name": "View Orders", "description": "View customer orders and order details", "module": "Orders", "action": "VIEW"},
    {"code": "ORDERS_CREATE", "name": "Create Orders", "description": "Create new customer orders in ERP", "module": "Orders", "action": "CREATE"},
    {"code": "ORDERS_EDIT", "name": "Edit Orders", "description": "Edit order quantities, dates, and instructions", "module": "Orders", "action": "EDIT"},
    {"code": "ORDERS_DELETE", "name": "Delete / Cancel Orders", "description": "Cancel or delete orders", "module": "Orders", "action": "DELETE"},
    {"code": "ORDERS_STATUS_UPDATE", "name": "Update Order Status", "description": "Advance order status (Received -> Preparing -> Delivered)", "module": "Orders", "action": "STATUS"},
    {"code": "ORDER_DELIVERY_RESCHEDULE", "name": "Reschedule Order Delivery", "description": "Reschedule customer order delivery date and time", "module": "Orders", "action": "EDIT"},

    # Clients
    {"code": "CLIENTS_VIEW", "name": "View Clients", "description": "View customer contacts and history", "module": "Clients", "action": "VIEW"},
    {"code": "CLIENTS_CREATE", "name": "Create Clients", "description": "Add new customer records", "module": "Clients", "action": "CREATE"},
    {"code": "CLIENTS_EDIT", "name": "Edit Clients", "description": "Modify client contact info and notes", "module": "Clients", "action": "EDIT"},
    {"code": "CLIENTS_DELETE", "name": "Delete Clients", "description": "Remove client profiles", "module": "Clients", "action": "DELETE"},

    # Calendar
    {"code": "CALENDAR_VIEW", "name": "View Calendar", "description": "View orders and deliveries calendar", "module": "Calendar", "action": "VIEW"},
    {"code": "CALENDAR_EDIT", "name": "Manage Calendar", "description": "Reschedule deliveries and production dates", "module": "Calendar", "action": "EDIT"},
    {"code": "NOTE_CREATE", "name": "Create Calendar Notes", "description": "Create operational calendar notes and reminders", "module": "Calendar", "action": "CREATE"},
    {"code": "NOTE_EDIT", "name": "Edit Calendar Notes", "description": "Edit operational calendar notes and completion status", "module": "Calendar", "action": "EDIT"},
    {"code": "NOTE_DELETE", "name": "Delete Calendar Notes", "description": "Delete operational calendar notes", "module": "Calendar", "action": "DELETE"},

    # Production
    {"code": "PRODUCTION_VIEW_OWN", "name": "View Own Production", "description": "View production tasks assigned to this user", "module": "Production", "action": "VIEW"},
    {"code": "PRODUCTION_VIEW_ALL", "name": "View All Production", "description": "View all kitchen production queues", "module": "Production", "action": "VIEW"},
    {"code": "PRODUCTION_CREATE", "name": "Create Production Tasks", "description": "Create kitchen baking tasks", "module": "Production", "action": "CREATE"},
    {"code": "PRODUCTION_EDIT_OWN", "name": "Edit Own Production Tasks", "description": "Edit notes and details on own assigned tasks", "module": "Production", "action": "EDIT"},
    {"code": "PRODUCTION_EDIT_ALL", "name": "Edit All Production Tasks", "description": "Edit any kitchen production task", "module": "Production", "action": "EDIT"},
    {"code": "PRODUCTION_STATUS_UPDATE", "name": "Update Production Stage", "description": "Progress baking stage (Preparing -> Baking -> Decorating -> Ready)", "module": "Production", "action": "STATUS"},
    {"code": "PRODUCTION_ASSIGN", "name": "Assign Bakers", "description": "Assign kitchen baking tasks to specific bakers", "module": "Production", "action": "ASSIGN"},
    {"code": "PRODUCTION_RESCHEDULE", "name": "Reschedule Production", "description": "Reschedule baking and decoration dates", "module": "Production", "action": "EDIT"},


    # Inventory
    {"code": "INVENTORY_VIEW", "name": "View Inventory", "description": "View ingredient stock levels and transactions", "module": "Inventory", "action": "VIEW"},
    {"code": "INVENTORY_CREATE", "name": "Create Ingredients", "description": "Add new raw ingredients", "module": "Inventory", "action": "CREATE"},
    {"code": "INVENTORY_EDIT", "name": "Edit Ingredients", "description": "Edit ingredient costs and min stock thresholds", "module": "Inventory", "action": "EDIT"},
    {"code": "INVENTORY_ADJUST", "name": "Adjust Stock Levels", "description": "Perform stock additions, deductions, and wastage recording", "module": "Inventory", "action": "ADJUST"},

    # Recipes
    {"code": "RECIPES_VIEW", "name": "View Recipes", "description": "View product ingredient formulations and recipe notes", "module": "Recipes", "action": "VIEW"},
    {"code": "RECIPES_CREATE", "name": "Create Recipes", "description": "Create new recipes for products", "module": "Recipes", "action": "CREATE"},
    {"code": "RECIPES_EDIT", "name": "Edit Recipes", "description": "Modify recipe ingredients and quantities", "module": "Recipes", "action": "EDIT"},

    # Finance & Costing
    {"code": "REVENUE_VIEW", "name": "View Revenue", "description": "View sales revenue totals", "module": "Finance", "action": "VIEW"},
    {"code": "PROFIT_VIEW", "name": "View Profit", "description": "View net profit and margins", "module": "Finance", "action": "VIEW"},
    {"code": "PAYMENTS_VIEW", "name": "View Payments", "description": "View customer payment records and balances", "module": "Finance", "action": "VIEW"},
    {"code": "PAYMENTS_CREATE", "name": "Record Payments", "description": "Record advance and final payments", "module": "Finance", "action": "CREATE"},
    {"code": "PAYMENTS_EDIT", "name": "Edit Payments", "description": "Modify recorded payments", "module": "Finance", "action": "EDIT"},
    {"code": "EXPENSES_VIEW", "name": "View Expenses", "description": "View operational bakery expenses", "module": "Finance", "action": "VIEW"},
    {"code": "EXPENSES_CREATE", "name": "Record Expenses", "description": "Record operational expenses and receipts", "module": "Finance", "action": "CREATE"},
    {"code": "EXPENSES_EDIT", "name": "Edit Expenses", "description": "Edit expense entries", "module": "Finance", "action": "EDIT"},
    {"code": "EXPENSES_DELETE", "name": "Delete Expenses", "description": "Delete expense records", "module": "Finance", "action": "DELETE"},
    {"code": "COSTING_VIEW", "name": "View Costing", "description": "View product costing breakdown", "module": "Finance", "action": "VIEW"},
    {"code": "COSTING_EDIT", "name": "Edit Costing", "description": "Modify labor and ingredient cost calculations", "module": "Finance", "action": "EDIT"},
    {"code": "FINANCIAL_REPORTS_VIEW", "name": "View Financial Reports", "description": "View monthly profit/loss and financial statements", "module": "Finance", "action": "VIEW"},

    # Analytics & Reports
    {"code": "ANALYTICS_VIEW", "name": "View Analytics", "description": "View ERP charts, order trends, and popular items", "module": "Analytics", "action": "VIEW"},
    {"code": "REPORTS_VIEW", "name": "View Reports", "description": "View business reports", "module": "Reports", "action": "VIEW"},
    {"code": "REPORTS_GENERATE", "name": "Export PDF & CSV Reports", "description": "Download PDF and CSV analytical reports", "module": "Reports", "action": "GENERATE"},

    # Feedback CMS
    {"code": "FEEDBACK_VIEW", "name": "View Feedback CMS", "description": "View customer reviews and feedback testimonials", "module": "Feedback", "action": "VIEW"},
    {"code": "FEEDBACK_CREATE", "name": "Create Feedback", "description": "Add feedback testimonials", "module": "Feedback", "action": "CREATE"},
    {"code": "FEEDBACK_EDIT", "name": "Edit Feedback", "description": "Publish/unpublish and edit reviews", "module": "Feedback", "action": "EDIT"},
    {"code": "FEEDBACK_DELETE", "name": "Delete Feedback", "description": "Remove customer feedback", "module": "Feedback", "action": "DELETE"},

    # Media Library
    {"code": "MEDIA_VIEW", "name": "View Media Library", "description": "View uploaded images and media files", "module": "Media", "action": "VIEW"},
    {"code": "MEDIA_UPLOAD", "name": "Upload Media", "description": "Upload new product photos and files", "module": "Media", "action": "UPLOAD"},
    {"code": "MEDIA_EDIT", "name": "Edit Media", "description": "Manage media filenames and tags", "module": "Media", "action": "EDIT"},
    {"code": "MEDIA_DELETE", "name": "Delete Media", "description": "Delete files from media storage", "module": "Media", "action": "DELETE"},

    # User & Role Management
    {"code": "USER_MANAGEMENT_VIEW", "name": "View Users", "description": "View ERP staff and baker accounts", "module": "Users", "action": "VIEW"},
    {"code": "USER_MANAGEMENT_CREATE", "name": "Create Users", "description": "Create new admin or baker accounts", "module": "Users", "action": "CREATE"},
    {"code": "USER_MANAGEMENT_EDIT", "name": "Edit Users", "description": "Edit user details and roles", "module": "Users", "action": "EDIT"},
    {"code": "USER_MANAGEMENT_DISABLE", "name": "Disable / Enable Users", "description": "Deactivate or reactivate user accounts", "module": "Users", "action": "DISABLE"},
    {"code": "USER_MANAGEMENT_RESET_PWD", "name": "Reset User Passwords", "description": "Reset passwords for staff members", "module": "Users", "action": "RESET_PWD"},
    {"code": "ROLE_MANAGEMENT", "name": "Manage Roles", "description": "Create and edit custom roles and permissions", "module": "Users", "action": "ROLES"},

    # Audit Logs
    {"code": "AUDIT_LOGS_VIEW", "name": "View Audit Logs", "description": "Inspect system security and activity audit logs", "module": "Audit", "action": "VIEW"},

    # Settings
    {"code": "SETTINGS_VIEW", "name": "View Settings", "description": "View bakery business settings", "module": "Settings", "action": "VIEW"},
    {"code": "SETTINGS_EDIT", "name": "Edit Settings", "description": "Modify store contact info, WhatsApp numbers, currency, and tax rates", "module": "Settings", "action": "EDIT"},
]

DEFAULT_SYSTEM_ROLES = {
    "Super Admin": {
        "description": "Full unrestricted access to all bakery ERP features, users, and financial data.",
        "permissions": [p["code"] for p in PERMISSIONS_DEFINITIONS]
    },
    "Content Admin": {
        "description": "Manage products, categories, descriptions, images, feedback, and media.",
        "permissions": [
            "PRODUCTS_VIEW", "PRODUCTS_CREATE", "PRODUCTS_EDIT", "PRODUCT_PRICE_EDIT",
            "CATEGORIES_VIEW", "CATEGORIES_CREATE", "CATEGORIES_EDIT",
            "FEEDBACK_VIEW", "FEEDBACK_CREATE", "FEEDBACK_EDIT", "FEEDBACK_DELETE",
            "MEDIA_VIEW", "MEDIA_UPLOAD", "MEDIA_EDIT", "MEDIA_DELETE"
        ]
    },
    "Order Admin": {
        "description": "Manage orders, clients, delivery calendar, payments, and view kitchen production.",
        "permissions": [
            "CLIENTS_VIEW", "CLIENTS_CREATE", "CLIENTS_EDIT",
            "ORDERS_VIEW", "ORDERS_CREATE", "ORDERS_EDIT", "ORDERS_STATUS_UPDATE", "ORDER_DELIVERY_RESCHEDULE",
            "CALENDAR_VIEW", "CALENDAR_EDIT", "NOTE_CREATE", "NOTE_EDIT", "NOTE_DELETE",
            "PRODUCTION_VIEW_ALL", "PRODUCTION_STATUS_UPDATE", "PRODUCTION_RESCHEDULE",
            "PAYMENTS_VIEW", "PAYMENTS_CREATE", "PAYMENTS_EDIT"
        ]
    },
    "Inventory Admin": {
        "description": "Manage inventory stock, record wastage, adjust supplies, and view recipes.",
        "permissions": [
            "INVENTORY_VIEW", "INVENTORY_CREATE", "INVENTORY_EDIT", "INVENTORY_ADJUST",
            "RECIPES_VIEW", "RECIPES_CREATE", "RECIPES_EDIT",
            "PRODUCTION_VIEW_ALL", "NOTE_CREATE", "NOTE_EDIT"
        ]
    },
    "Finance Admin": {
        "description": "Access product costing, expenses, revenue, profit metrics, and financial reports.",
        "permissions": [
            "COSTING_VIEW", "COSTING_EDIT",
            "EXPENSES_VIEW", "EXPENSES_CREATE", "EXPENSES_EDIT", "EXPENSES_DELETE",
            "REVENUE_VIEW", "PROFIT_VIEW", "PAYMENTS_VIEW", "PAYMENTS_CREATE", "PAYMENTS_EDIT",
            "PRODUCT_COST_VIEW", "PRODUCT_COST_EDIT", "FINANCIAL_REPORTS_VIEW",
            "ANALYTICS_VIEW", "REPORTS_VIEW", "REPORTS_GENERATE"
        ]
    },
    "Baker": {
        "description": "Production staff responsible for preparing, baking, decorating, and readying assigned cakes.",
        "permissions": [
            "PRODUCTION_VIEW_OWN", "PRODUCTION_EDIT_OWN", "PRODUCTION_STATUS_UPDATE",
            "CALENDAR_VIEW", "RECIPES_VIEW", "NOTE_CREATE"
        ]
    }

}

def get_user_effective_permissions(user: User, db: Session) -> Set[str]:
    """
    Computes the effective permissions for a user:
    1. If user is Super Admin -> ALL permissions.
    2. Role permissions: union of permissions for all assigned roles.
    3. + GRANT overrides: permissions explicitly granted to this user.
    4. - DENY overrides: permissions explicitly denied to this user (overrides role inheritance).
    """
    all_codes = {p["code"] for p in PERMISSIONS_DEFINITIONS}
    if user.is_superadmin:
        return all_codes

    # 1. Base permissions from user's roles
    role_permissions: Set[str] = set()
    user_roles = db.query(UserRole).filter(UserRole.user_id == user.id).all()
    for ur in user_roles:
        if ur.role:
            for p in ur.role.permissions:
                role_permissions.add(p.code)

    # 2. Process user overrides
    overrides = db.query(UserPermissionOverride).filter(UserPermissionOverride.user_id == user.id).all()
    grant_codes: Set[str] = set()
    deny_codes: Set[str] = set()

    for ov in overrides:
        if ov.permission:
            if ov.effect.upper() == "GRANT":
                grant_codes.add(ov.permission.code)
            elif ov.effect.upper() == "DENY":
                deny_codes.add(ov.permission.code)

    # Effective = (Role Permissions ∪ Grants) \ Denies
    effective = (role_permissions | grant_codes) - deny_codes
    return effective

def require_permission(permission_code: str):
    """
    FastAPI dependency factory enforcing a specific granular permission.
    Returns 403 Forbidden if user is unauthorized.
    """
    def permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        if not current_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated."
            )
        
        effective_perms = get_user_effective_permissions(current_user, db)
        if permission_code not in effective_perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: You do not have the required permission '{permission_code}'."
            )
        return current_user

    return permission_checker

def require_any_permission(permission_codes: List[str]):
    """
    FastAPI dependency factory allowing access if user holds at least one of the specified permissions.
    """
    def any_permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        if not current_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated."
            )
        
        effective_perms = get_user_effective_permissions(current_user, db)
        if not any(code in effective_perms for code in permission_codes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Missing any of the required permissions {permission_codes}."
            )
        return current_user

    return any_permission_checker

def require_super_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    FastAPI dependency strictly restricting an endpoint to the Owner / Super Admin.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is deactivated.")
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: This action requires Owner / Super Admin privileges."
        )
    return current_user

def verify_production_access(
    production_id: int,
    action: str = "view",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Production:
    """
    Resource-level verification for production tasks.
    - If user has PRODUCTION_VIEW_ALL (for view) or PRODUCTION_EDIT_ALL (for edit/status), allowed.
    - If user only has PRODUCTION_VIEW_OWN / PRODUCTION_EDIT_OWN, task must be assigned to current_user.id.
    """
    prod = db.query(Production).filter(Production.id == production_id).first()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Production task not found.")

    if current_user.is_superadmin:
        return prod

    effective_perms = get_user_effective_permissions(current_user, db)

    if action == "view":
        if "PRODUCTION_VIEW_ALL" in effective_perms:
            return prod
        if "PRODUCTION_VIEW_OWN" in effective_perms and prod.assigned_to_id == current_user.id:
            return prod
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to view this production task."
        )
    elif action in ["edit", "status"]:
        if "PRODUCTION_EDIT_ALL" in effective_perms:
            return prod
        if ("PRODUCTION_EDIT_OWN" in effective_perms or "PRODUCTION_STATUS_UPDATE" in effective_perms) and prod.assigned_to_id == current_user.id:
            return prod
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You cannot modify a production task that is not assigned to you."
        )

    return prod
