import urllib.request
import urllib.error
import json

print('=== 1. PUBLIC WEBSITE ROUTES VERIFICATION ===')
pub_urls = [
    'http://localhost:3000/',
    'http://localhost:3000/menu',
    'http://localhost:3000/wedding-cakes',
    'http://localhost:3000/bento-cakes',
    'http://localhost:3000/feedback'
]
for u in pub_urls:
    try:
        req = urllib.request.Request(u)
        with urllib.request.urlopen(req) as res:
            print(f'[OK 200] GET {u} -> Length: {len(res.read())}')
    except Exception as e:
        print(f'[FAIL] GET {u} -> {e}')

print('\n=== 2. PUBLIC API SAFETY & SANITIZATION VERIFICATION ===')
req_prod = urllib.request.Request('http://localhost:8000/api/products')
with urllib.request.urlopen(req_prod) as res:
    data = json.loads(res.read().decode())
    print(f'[OK] Fetched {len(data)} public products')
    sample = data[0]
    print(f'   Product Name: {sample.get("name")}')
    print(f'   Price: Rs.{sample.get("price")}')
    print(f'   Recipe (Should be None): {sample.get("recipe")}')
    print(f'   Calculated Cost (Should be 0.0): {sample.get("calculated_cost")}')
    print(f'   Profit Margin (Should be 0.0): {sample.get("profit_margin")}')

print('\n=== 3. DIRECT SERVER SECURITY (UNAUTHENTICATED DENIAL) ===')
protected_apis = [
    'http://localhost:8000/api/orders',
    'http://localhost:8000/api/clients',
    'http://localhost:8000/api/inventory',
    'http://localhost:8000/api/analytics/dashboard',
    'http://localhost:8000/api/feedback/admin'
]
for target in protected_apis:
    try:
        req = urllib.request.Request(target)
        with urllib.request.urlopen(req) as res:
            print(f'[SECURITY RISK] Unexpected 200 for {target}')
    except urllib.error.HTTPError as err:
        if err.code == 401:
            print(f'[SECURE 401] Access correctly denied for {target}')
        else:
            print(f'[HTTP {err.code}] {target}')

print('\n=== 4. AUTHENTICATED ADMIN ACCESS VERIFICATION ===')
auth_data = json.dumps({'email': 'admin@bakelicious.com', 'password': 'admin123'}).encode('utf-8')
login_req = urllib.request.Request('http://localhost:8000/api/auth/login', data=auth_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(login_req) as res:
    login_res = json.loads(res.read().decode())
    token = login_res.get('access_token')
    print(f'[AUTH SUCCESS] Logged in as Admin. Token: {token[:20]}...')

    # Test authenticated products call
    admin_prod_req = urllib.request.Request('http://localhost:8000/api/products', headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(admin_prod_req) as p_res:
        admin_data = json.loads(p_res.read().decode())
        admin_sample = admin_data[0]
        print(f'[ADMIN ACCESS] Product Name: {admin_sample.get("name")}')
        print(f'   Calculated Cost (Full ERP): Rs.{admin_sample.get("calculated_cost")}')
        print(f'   Profit Margin (Full ERP): {admin_sample.get("profit_margin")}%')

    # Test authenticated orders call
    admin_orders_req = urllib.request.Request('http://localhost:8000/api/orders', headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(admin_orders_req) as o_res:
        orders_data = json.loads(o_res.read().decode())
        print(f'[ADMIN ACCESS] Fetched {len(orders_data)} orders successfully!')
