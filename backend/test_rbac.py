import os
import sys
from fastapi.testclient import TestClient

from app.main import app
from app.database.connection import SessionLocal
from app.models.user import User
from app.models.role import Role, Permission, UserRole, UserPermissionOverride
from app.models.production import Production
from app.models.order import Order
from app.auth.security import get_password_hash
from app.auth.permissions import get_user_effective_permissions

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("STARTING BAKELICIOUS RBAC INTEGRITY & SECURITY TESTS")
    print("==================================================")
    
    db = SessionLocal()
    try:
        # 1. Test Super Admin Login
        login_res = client.post("/api/auth/login", json={
            "username": "admin@bakelicious.com",
            "password": "admin123"
        })
        assert login_res.status_code == 200, f"Super Admin login failed: {login_res.text}"
        admin_token = login_res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("[PASS] Super Admin Login Successful")

        # 2. Test Super Admin Protection (Cannot disable Super Admin)
        owner = db.query(User).filter(User.email == "admin@bakelicious.com").first()
        assert owner.is_superadmin is True, "Owner is not marked as superadmin"
        
        disable_owner_res = client.put(f"/api/users/{owner.id}/status", json={"is_active": False}, headers=admin_headers)
        assert disable_owner_res.status_code in [400, 403], f"Super Admin disable should be rejected with 403/400, got {disable_owner_res.status_code}"
        print("[PASS] Super Admin account is protected against deactivation")

        # 3. Test Baker Login & Resource-level Isolation
        baker_login = client.post("/api/auth/login", json={
            "username": "baker.rahul@bakelicious.com",
            "password": "baker123"
        })
        assert baker_login.status_code == 200, f"Baker login failed: {baker_login.text}"
        baker_token = baker_login.json()["access_token"]
        baker_headers = {"Authorization": f"Bearer {baker_token}"}
        print("[PASS] Baker Rahul Login Successful")

        # Baker fetching production tasks should ONLY return their assigned tasks
        baker_tasks_res = client.get("/api/production", headers=baker_headers)
        assert baker_tasks_res.status_code == 200, f"Baker fetch tasks failed: {baker_tasks_res.text}"
        baker_tasks = baker_tasks_res.json()
        
        baker_rahul = db.query(User).filter(User.username == "baker_rahul").first()
        for t in baker_tasks:
            assert t["assigned_to_id"] == baker_rahul.id, f"Baker saw task not assigned to him! Task: {t}"
        print(f"[PASS] Baker Resource-Level Security Verified: Baker saw only {len(baker_tasks)} assigned task(s).")

        # Baker attempting to update task assigned to another baker (e.g. Baker Priya) must return 403 Forbidden
        priya_task = db.query(Production).filter(Production.assigned_to_id != baker_rahul.id, Production.assigned_to_id != None).first()
        if priya_task:
            cross_update_res = client.put(f"/api/production/{priya_task.id}", json={"status": "Ready"}, headers=baker_headers)
            assert cross_update_res.status_code == 403, f"Cross-baker task edit should be 403 Forbidden! Got {cross_update_res.status_code}"
            print("[PASS] Cross-Baker Task Modification Blocked (403 Forbidden)")

        # 4. Test Baker Unauthorized Access to Financial APIs
        analytics_forbidden = client.get("/api/analytics/overview", headers=baker_headers)
        assert analytics_forbidden.status_code == 403, "Baker should not have access to financial analytics overview"
        print("[PASS] Financial Analytics Blocked for Unauthorized Staff (403 Forbidden)")

        # 5. Test Permission Overrides: (Role ∪ GRANT) \ DENY
        # Let's test DENY override on Content Admin
        content_login = client.post("/api/auth/login", json={
            "username": "content@bakelicious.com",
            "password": "content123"
        })
        assert content_login.status_code == 200, "Content Admin login failed"
        content_token = content_login.json()["access_token"]
        content_headers = {"Authorization": f"Bearer {content_token}"}
        
        content_user = db.query(User).filter(User.username == "content").first()
        # Content admin originally has PRODUCTS_CREATE
        perms_before = get_user_effective_permissions(content_user, db)
        assert "PRODUCTS_CREATE" in perms_before, "Content Admin should have PRODUCTS_CREATE by default"

        # Apply DENY override for PRODUCTS_CREATE
        perm_create = db.query(Permission).filter(Permission.code == "PRODUCTS_CREATE").first()
        override_deny = UserPermissionOverride(user_id=content_user.id, permission_id=perm_create.id, effect="DENY")
        db.add(override_deny)
        db.commit()

        perms_after = get_user_effective_permissions(content_user, db)
        assert "PRODUCTS_CREATE" not in perms_after, "DENY override failed to strip permission!"
        
        # Test API rejection
        create_prod_res = client.post("/api/products", json={
            "name": "Unauthorized Cake",
            "category_id": 1,
            "price": 500,
            "prep_time_hours": 1
        }, headers=content_headers)
        assert create_prod_res.status_code == 403, f"Denied action should return 403 Forbidden, got {create_prod_res.status_code}"
        print("[PASS] User-Level DENY Override Successfully Stripped Role Permission & Blocked Action (403 Forbidden)")

        # Remove DENY and add custom GRANT (e.g. INVENTORY_VIEW)
        db.delete(override_deny)
        perm_inv = db.query(Permission).filter(Permission.code == "INVENTORY_VIEW").first()
        override_grant = UserPermissionOverride(user_id=content_user.id, permission_id=perm_inv.id, effect="GRANT")
        db.add(override_grant)
        db.commit()

        perms_grant = get_user_effective_permissions(content_user, db)
        assert "INVENTORY_VIEW" in perms_grant, "GRANT override failed to grant permission!"
        inv_res = client.get("/api/ingredients", headers=content_headers)
        assert inv_res.status_code == 200, "Content Admin with GRANT INVENTORY_VIEW should be able to view inventory"
        print("[PASS] User-Level GRANT Override Successfully Extended Permissions")

        # Cleanup test override
        db.delete(override_grant)
        db.commit()

        # 6. Test Public Endpoints (Zero Disruption to Website)
        public_products = client.get("/api/products")
        assert public_products.status_code == 200, "Public products endpoint failed"
        assert len(public_products.json()) > 0, "No public products returned"

        public_feedback = client.get("/api/feedback")
        assert public_feedback.status_code == 200, "Public feedback endpoint failed"

        public_settings = client.get("/api/settings")
        assert public_settings.status_code == 200, "Public settings endpoint failed"
        print("[PASS] Public Website Endpoints Intact & Functioning Unauthenticated")

        print("==================================================")
        print("ALL RBAC INTEGRITY & SECURITY TESTS PASSED (6/6)!")
        print("==================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
