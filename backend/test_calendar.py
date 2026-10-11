import os
import sys
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database.connection import SessionLocal
from app.models.user import User
from app.models.order import Order
from app.models.production import Production
from app.models.calendar_note import CalendarNote
from app.models.inventory import InventoryTransaction
from app.models.ingredient import Ingredient

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("STARTING BAKERY OPERATIONS CALENDAR API TESTS")
    print("==================================================")

    db = SessionLocal()
    try:
        # 1. Super Admin Login
        login_res = client.post("/api/auth/login", json={
            "username": "admin@bakelicious.com",
            "password": "admin123"
        })
        assert login_res.status_code == 200, f"Super Admin login failed: {login_res.text}"
        admin_token = login_res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("[PASS] Super Admin Login Successful")

        # 2. Baker Login
        baker_login = client.post("/api/auth/login", json={
            "username": "baker.rahul@bakelicious.com",
            "password": "baker123"
        })
        assert baker_login.status_code == 200, f"Baker login failed: {baker_login.text}"
        baker_token = baker_login.json()["access_token"]
        baker_headers = {"Authorization": f"Bearer {baker_token}"}
        print("[PASS] Baker Rahul Login Successful")

        # 3. Test GET /api/calendar/summary
        summary_res = client.get("/api/calendar/summary", headers=admin_headers)
        assert summary_res.status_code == 200, f"Fetch summary failed: {summary_res.text}"
        summary_data = summary_res.json()
        assert "new_orders_today" in summary_data
        assert "making_today" in summary_data
        assert "ready_today" in summary_data
        assert "deliveries_scheduled_today" in summary_data
        assert "deliveries_completed_today" in summary_data
        assert "late_overdue_today" in summary_data
        assert "stock_updates_today" in summary_data
        assert "notes_today" in summary_data
        print(f"[PASS] Operational Summary Metrics Returned: {summary_data}")

        # 4. Test GET /api/calendar/events
        events_res = client.get("/api/calendar/events", headers=admin_headers)
        assert events_res.status_code == 200, f"Fetch events failed: {events_res.text}"
        events = events_res.json()
        print(f"[PASS] Calendar Events Fetched Successfully ({len(events)} events returned)")

        # Verify distinct color codes & event types
        valid_event_types = {"NEW_ORDER", "MAKING", "READY", "DELIVERY", "DELIVERED", "LATE", "STOCK", "NOTE"}
        for ev in events:
            assert ev["event_type"] in valid_event_types, f"Unknown event_type: {ev['event_type']}"
            assert "color" in ev and ev["color"].startswith("#")

        print("[PASS] Multi-Event Types & Color Tokens Verified")

        # 5. Test Custom Notes CRUD
        note_payload = {
            "title": "Buy Extra Whipping Cream",
            "description": "2 x 1L packs for weekend order",
            "start_datetime": datetime.utcnow().isoformat(),
            "all_day": True,
            "priority": "High",
            "color": "#8B5CF6"
        }
        create_note_res = client.post("/api/calendar/notes", json=note_payload, headers=admin_headers)
        assert create_note_res.status_code == 201, f"Note creation failed: {create_note_res.text}"
        created_note = create_note_res.json()
        note_id = created_note["id"]
        print(f"[PASS] Custom Note Created (ID: {note_id})")

        # Update note
        update_note_res = client.put(f"/api/calendar/notes/{note_id}", json={
            "title": "Buy Extra Whipping Cream & Strawberries",
            "is_completed": True
        }, headers=admin_headers)
        assert update_note_res.status_code == 200, f"Note update failed: {update_note_res.text}"
        updated_note = update_note_res.json()
        assert updated_note["is_completed"] is True
        print("[PASS] Custom Note Updated & Marked Completed")

        # Delete note
        delete_note_res = client.delete(f"/api/calendar/notes/{note_id}", headers=admin_headers)
        assert delete_note_res.status_code == 204, f"Note deletion failed: {delete_note_res.text}"
        print("[PASS] Custom Note Deleted")

        # 6. Test Atomic Rescheduling
        ord = db.query(Order).first()
        if ord:
            new_date = (datetime.utcnow() + timedelta(days=2)).isoformat()
            reschedule_res = client.post("/api/calendar/reschedule", json={
                "entity_type": "ORDER_DELIVERY",
                "entity_id": ord.id,
                "new_start_datetime": new_date
            }, headers=admin_headers)
            assert reschedule_res.status_code == 200, f"Order delivery reschedule failed: {reschedule_res.text}"
            print(f"[PASS] Atomic Order Delivery Reschedule Succeeded for Order {ord.order_number}")

            # Test Baker permission restriction (Baker cannot reschedule order delivery)
            baker_reschedule_res = client.post("/api/calendar/reschedule", json={
                "entity_type": "ORDER_DELIVERY",
                "entity_id": ord.id,
                "new_start_datetime": new_date
            }, headers=baker_headers)
            assert baker_reschedule_res.status_code == 403, f"Baker should be blocked from rescheduling order delivery, got {baker_reschedule_res.status_code}"
            print("[PASS] Baker Restricted from Rescheduling Order Delivery (403 Forbidden)")

        # 7. Test Inventory Adjustment from Calendar Action
        ing = db.query(Ingredient).first()
        if ing:
            stock_adj_res = client.post("/api/inventory/adjust", json={
                "ingredient_id": ing.id,
                "type": "PURCHASE",
                "quantity_change": 5.0,
                "unit_cost_at_time": float(ing.unit_cost or 100),
                "notes": "Added from calendar operations view"
            }, headers=admin_headers)
            assert stock_adj_res.status_code in [200, 201], f"Stock adjustment failed: {stock_adj_res.text}"
            print(f"[PASS] Stock Adjustment Recorded for {ing.name}")

        print("==================================================")
        print("ALL BAKERY OPERATIONS CALENDAR TESTS PASSED!")
        print("==================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
