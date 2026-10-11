import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings
from app.database.connection import engine, SessionLocal
from app.database import base  # Ensures metadata is loaded
from app.models.role import Permission, Role, RolePermission
from app.auth.permissions import PERMISSIONS_DEFINITIONS, DEFAULT_SYSTEM_ROLES
from app.api import (
    auth, categories, products, ingredients, recipes, clients,
    orders, production, inventory, expenses, analytics, reports,
    settings as settings_api, audit_logs, uploads, feedback,
    users as users_api, roles as roles_api, calendar as calendar_api
)

# Initialize database tables if not existing
base.Base.metadata.create_all(bind=engine)


def sync_rbac_metadata():
    """Ensures all standard permissions and system roles exist in the database."""
    db: Session = SessionLocal()
    try:
        # 1. Sync permissions
        for p_def in PERMISSIONS_DEFINITIONS:
            perm = db.query(Permission).filter(Permission.code == p_def["code"]).first()
            if not perm:
                perm = Permission(
                    code=p_def["code"],
                    name=p_def["name"],
                    description=p_def.get("description"),
                    module=p_def["module"],
                    action=p_def.get("action")
                )
                db.add(perm)
            else:
                perm.name = p_def["name"]
                perm.description = p_def.get("description")
                perm.module = p_def["module"]
                perm.action = p_def.get("action")
        db.commit()

        # 2. Sync system roles
        for role_name, r_info in DEFAULT_SYSTEM_ROLES.items():
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(
                    name=role_name,
                    description=r_info["description"],
                    is_system_role=True
                )
                db.add(role)
                db.flush()
            else:
                role.is_system_role = True
                role.description = r_info["description"]

            # If system role has no permissions linked yet, attach default ones
            existing_p_ids = {rp.permission_id for rp in db.query(RolePermission).filter(RolePermission.role_id == role.id).all()}
            if not existing_p_ids:
                for code in r_info["permissions"]:
                    p = db.query(Permission).filter(Permission.code == code).first()
                    if p:
                        db.add(RolePermission(role_id=role.id, permission_id=p.id))
        db.commit()
    except Exception as e:
        print(f"[RBAC SYNC] Warning during RBAC initialization: {e}")
        db.rollback()
    finally:
        db.close()

# Run RBAC metadata sync
sync_rbac_metadata()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1):(3000|3001|8000)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users_api.router, prefix=settings.API_V1_STR)
app.include_router(roles_api.router, prefix=settings.API_V1_STR)
app.include_router(categories.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(ingredients.router, prefix=settings.API_V1_STR)
app.include_router(recipes.router, prefix=settings.API_V1_STR)
app.include_router(clients.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)
app.include_router(production.router, prefix=settings.API_V1_STR)
app.include_router(inventory.router, prefix=settings.API_V1_STR)
app.include_router(expenses.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(settings_api.router, prefix=settings.API_V1_STR)
app.include_router(audit_logs.router, prefix=settings.API_V1_STR)
app.include_router(uploads.router, prefix=settings.API_V1_STR)
app.include_router(feedback.router, prefix=settings.API_V1_STR)
app.include_router(calendar_api.router, prefix=settings.API_V1_STR)


# Serve uploaded product files statically at /api/uploads/products/...
uploads_dir = os.path.join(os.getcwd(), settings.UPLOAD_DIR)
products_upload_dir = os.path.join(uploads_dir, "products")
os.makedirs(uploads_dir, exist_ok=True)
os.makedirs(products_upload_dir, exist_ok=True)

app.mount(f"{settings.API_V1_STR}/uploads/products", StaticFiles(directory=products_upload_dir), name="uploads_products")
app.mount(f"{settings.API_V1_STR}/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get("/")
def root():
    return {
        "message": "Bakelicious ERP API Server is running",
        "docs": "/docs",
        "version": "1.0.0"
    }
