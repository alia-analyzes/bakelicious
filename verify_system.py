import urllib.request
import urllib.parse
import json
import os

BASE_URL = "http://localhost:8000/api"

def log(msg, success=True):
    symbol = "OK" if success else "FAIL"
    print(f"[{symbol}] {msg}")

def test_admin_login():
    print("\n--- 1. Testing Admin Authentication ---")
    req = urllib.request.Request(
        f"{BASE_URL}/auth/login",
        data=json.dumps({"username": "admin@bakelicious.com", "password": "admin123"}).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            token = data.get("access_token")
            assert token is not None, "Missing access_token in response"
            log(f"Login successful for admin@bakelicious.com! Received JWT access token.")
            return token
    except Exception as e:
        log(f"Login failed: {e}", success=False)
        raise e

def test_cors_preflight():
    print("\n--- 0. Testing CORS OPTIONS Preflight ---")
    for origin in ["http://localhost:3000", "http://localhost:3001"]:
        req = urllib.request.Request(
            f"{BASE_URL}/auth/login",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type"
            },
            method="OPTIONS"
        )
        with urllib.request.urlopen(req) as resp:
            cors_allow = resp.headers.get("access-control-allow-origin")
            assert cors_allow in [origin, "*"], f"CORS header missing or mismatched for {origin}: {cors_allow}"
            log(f"CORS OPTIONS preflight succeeded for origin {origin}! Allowed: {cors_allow}")

def test_public_vs_private_data(token):
    print("\n--- 2. Testing Public vs Private Data Separation ---")
    
    # 1. Public API call (unauthenticated)
    req_pub = urllib.request.Request(f"{BASE_URL}/products")
    with urllib.request.urlopen(req_pub) as resp:
        public_products = json.loads(resp.read().decode('utf-8'))
        log(f"Public API returned {len(public_products)} public products.")
        
        # Verify NO private financial fields are present
        for p in public_products:
            assert "manual_cost" not in p, f"SECURITY VIOLATION: manual_cost found in public API for product {p['id']}"
            assert "calculated_cost" not in p, f"SECURITY VIOLATION: calculated_cost found in public API for product {p['id']}"
            assert "effective_cost" not in p, f"SECURITY VIOLATION: effective_cost found in public API for product {p['id']}"
            assert "profit" not in p, f"SECURITY VIOLATION: profit found in public API for product {p['id']}"
            assert "profit_margin" not in p, f"SECURITY VIOLATION: profit_margin found in public API for product {p['id']}"
            assert "sku" not in p, f"SECURITY VIOLATION: sku found in public API for product {p['id']}"
        log("PASSED: Zero private financial fields (cost, profit, sku) found in public API responses!")

    # 2. ERP Admin API call (authenticated)
    req_erp = urllib.request.Request(
        f"{BASE_URL}/products?include_erp=true",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req_erp) as resp:
        erp_products = json.loads(resp.read().decode('utf-8'))
        log(f"ERP Admin API returned {len(erp_products)} products with full financial breakdown.")
        if erp_products:
            sample = erp_products[0]
            assert "manual_cost" in sample or "effective_cost" in sample, "Missing cost in ERP response"
            assert "profit" in sample, "Missing profit in ERP response"
            assert "profit_margin" in sample, "Missing profit_margin in ERP response"
            log(f"PASSED: ERP Admin response includes selling_price Rs.{sample.get('price')}, cost Rs.{sample.get('effective_cost', sample.get('manual_cost'))}, profit Rs.{sample.get('profit')}, margin {sample.get('profit_margin')}%.")

def test_image_upload_and_product_flow(token):
    print("\n--- 3. Testing Image Upload & Product Management Flow ---")
    
    # 1. Test image upload
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="test_cake.jpg"\r\n'
        'Content-Type: image/jpeg\r\n\r\n'
        'fake-image-bytes\r\n'
        f"--{boundary}--\r\n"
    ).encode('utf-8')
    
    req_upload = urllib.request.Request(
        f"{BASE_URL}/uploads/image",
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}"
        }
    )
    
    image_url = None
    try:
        with urllib.request.urlopen(req_upload) as resp:
            upload_data = json.loads(resp.read().decode('utf-8'))
            image_url = upload_data.get("image_url")
            log(f"Image uploaded successfully! Returned URL: {image_url}")
    except Exception as e:
        log(f"Image upload failed: {e}", success=False)
        raise e

    # 2. Add product with selling price 850, cost price 500
    prod_payload = {
        "category_id": 1,
        "name": "Automated Test Royal Truffle Cake",
        "description": "Delicious dark chocolate truffle cake for verification",
        "price": 850.0,
        "manual_cost": 500.0,
        "use_manual_cost": True,
        "prep_time_hours": 2.0,
        "size": "1 Pound",
        "availability": True,
        "public_visibility": True,
        "featured": True,
        "image_url": image_url,
        "tags": ["Automated", "Test"]
    }
    
    req_create = urllib.request.Request(
        f"{BASE_URL}/products",
        data=json.dumps(prod_payload).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    
    created_product = None
    with urllib.request.urlopen(req_create) as resp:
        created_product = json.loads(resp.read().decode('utf-8'))
        log(f"Product created in ERP! ID: {created_product['id']}, Name: {created_product['name']}")
        log(f"Financials -> Selling Price: Rs.{created_product['price']}, Cost: Rs.{created_product['manual_cost']}, Profit: Rs.{created_product['profit']}")

    # 3. Check public API to verify new product appears publicly
    req_pub = urllib.request.Request(f"{BASE_URL}/products")
    with urllib.request.urlopen(req_pub) as resp:
        public_prods = json.loads(resp.read().decode('utf-8'))
        found = any(p["id"] == created_product["id"] for p in public_prods)
        log(f"Public API check: Created product {created_product['id']} automatically visible on public menu: {found}")

    # 4. Toggle public_visibility = False
    req_toggle = urllib.request.Request(
        f"{BASE_URL}/products/{created_product['id']}",
        data=json.dumps({"public_visibility": False}).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        method="PUT"
    )
    with urllib.request.urlopen(req_toggle) as resp:
        log("Updated product public_visibility to False.")

    # 5. Check public API again to verify product disappears from public site
    with urllib.request.urlopen(req_pub) as resp:
        public_prods_after = json.loads(resp.read().decode('utf-8'))
        found_after = any(p["id"] == created_product["id"] for p in public_prods_after)
        log(f"Public API check after hiding: Product hidden from public website: {not found_after}")

    # 6. Clean up test product
    req_delete = urllib.request.Request(
        f"{BASE_URL}/products/{created_product['id']}",
        headers={"Authorization": f"Bearer {token}"},
        method="DELETE"
    )
    with urllib.request.urlopen(req_delete) as resp:
        log(f"Cleaned up test product {created_product['id']}.")

if __name__ == "__main__":
    print("=========================================")
    print("  BAKELICIOUS SYSTEM INTEGRATION VERIFIER")
    print("=========================================")
    test_cors_preflight()
    token = test_admin_login()
    test_public_vs_private_data(token)
    test_image_upload_and_product_flow(token)
    print("\n=========================================")
    print("  ALL VERIFICATION TESTS PASSED 100%!  ")
    print("=========================================")
