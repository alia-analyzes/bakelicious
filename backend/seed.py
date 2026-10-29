import os
import shutil
from datetime import datetime, timedelta
from decimal import Decimal

from app.database.connection import engine, SessionLocal
from app.database import base
from app.models.user import User
from app.models.role import Role, Permission, RolePermission, UserRole, UserPermissionOverride
from app.models.category import Category
from app.models.product import Product
from app.models.ingredient import Ingredient
from app.models.recipe import Recipe, RecipeItem
from app.models.client import Client
from app.models.order import Order, OrderItem
from app.models.production import Production
from app.models.expense import Expense
from app.models.inventory import InventoryTransaction
from app.models.feedback import Feedback
from app.auth.security import get_password_hash
from app.auth.permissions import PERMISSIONS_DEFINITIONS, DEFAULT_SYSTEM_ROLES

def copy_logo_files():
    backend_logo = os.path.join(os.getcwd(), "uploads", "logo.png")
    frontend_logo = os.path.join(os.path.dirname(os.getcwd()), "frontend", "public", "logo.png")
    os.makedirs(os.path.dirname(backend_logo), exist_ok=True)
    os.makedirs(os.path.dirname(frontend_logo), exist_ok=True)
    if os.path.exists(frontend_logo) and not os.path.exists(backend_logo):
        shutil.copy(frontend_logo, backend_logo)
        print(f"Copied logo to {backend_logo}")
    elif os.path.exists(backend_logo) and not os.path.exists(frontend_logo):
        shutil.copy(backend_logo, frontend_logo)
        print(f"Copied logo to {frontend_logo}")
    else:
        print(f"Logo files verified: {frontend_logo} and {backend_logo}")

def seed_database(is_development: bool = True):
    base.Base.metadata.drop_all(bind=engine)
    base.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Seed Permissions
    permissions_map = {}
    for p_def in PERMISSIONS_DEFINITIONS:
        perm = Permission(
            code=p_def["code"],
            name=p_def["name"],
            description=p_def.get("description"),
            module=p_def["module"],
            action=p_def.get("action")
        )
        db.add(perm)
        db.flush()
        permissions_map[perm.code] = perm
    print(f"Seeded {len(permissions_map)} granular permissions")

    # 2. Seed System Roles & Attach Default Permissions
    roles_map = {}
    for role_name, r_info in DEFAULT_SYSTEM_ROLES.items():
        role = Role(
            name=role_name,
            description=r_info["description"],
            is_system_role=True
        )
        db.add(role)
        db.flush()
        roles_map[role_name] = role

        for code in r_info["permissions"]:
            if code in permissions_map:
                db.add(RolePermission(role_id=role.id, permission_id=permissions_map[code].id))
    db.commit()
    print(f"Seeded {len(roles_map)} system roles with permissions")

    # 3. Seed Primary Super Admin / Owner
    admin = User(
        email="admin@bakelicious.com",
        username="admin",
        full_name="Bakelicious Super Admin (Owner)",
        hashed_password=get_password_hash("admin123"),
        is_superadmin=True,
        is_active=True,
        force_password_change=False
    )
    db.add(admin)
    db.flush()
    db.add(UserRole(user_id=admin.id, role_id=roles_map["Super Admin"].id))
    print("Seeded Super Admin user: admin@bakelicious.com / admin123")

    # 4. Seed Development Test Accounts (Only in Development)
    bakers_created = []
    if is_development:
        # Sample Department Admins
        dev_admins = [
            ("content@bakelicious.com", "content", "Content Manager", "content123", "Content Admin"),
            ("orders@bakelicious.com", "orders", "Order Manager", "orders123", "Order Admin"),
            ("inventory@bakelicious.com", "inventory", "Inventory Manager", "inventory123", "Inventory Admin"),
            ("finance@bakelicious.com", "finance", "Finance Manager", "finance123", "Finance Admin"),
        ]
        for email, uname, fname, pwd, rname in dev_admins:
            u = User(
                email=email,
                username=uname,
                full_name=fname,
                hashed_password=get_password_hash(pwd),
                is_superadmin=False,
                is_active=True,
                force_password_change=False
            )
            db.add(u)
            db.flush()
            if rname in roles_map:
                db.add(UserRole(user_id=u.id, role_id=roles_map[rname].id))
            print(f"Seeded Dev Admin: {email} / {pwd} (Role: {rname})")

        # Sample Baker Staff Accounts
        dev_bakers = [
            ("baker.rahul@bakelicious.com", "baker_rahul", "Baker Rahul", "baker123"),
            ("baker.priya@bakelicious.com", "baker_priya", "Baker Priya", "baker123"),
            ("baker.amit@bakelicious.com", "baker_amit", "Baker Amit", "baker123"),
        ]
        for email, uname, fname, pwd in dev_bakers:
            baker_user = User(
                email=email,
                username=uname,
                full_name=fname,
                hashed_password=get_password_hash(pwd),
                is_superadmin=False,
                is_active=True,
                force_password_change=False
            )
            db.add(baker_user)
            db.flush()
            db.add(UserRole(user_id=baker_user.id, role_id=roles_map["Baker"].id))
            bakers_created.append(baker_user)
            print(f"Seeded Dev Baker: {email} / {pwd} (Role: Baker)")

    # 5. Categories
    cat_names = [
        "All Cakes",
        "Chocolate Cakes",
        "Designer Cakes",
        "Bento Cakes",
        "Wedding Cakes",
        "Cake Platters",
        "Birthday Cakes",
        "Anniversary Cakes",
        "Custom Cakes",
        "Seasonal Specials",
        "Classic Cakes",
        "Fresh Cream Cakes",
        "Premium Cakes"
    ]
    categories = {}
    for name in cat_names:
        cat = Category(name=name, description=f"Premium Bakelicious {name.lower()}")
        db.add(cat)
        db.flush()
        categories[name] = cat
    print(f"Seeded {len(categories)} categories")

    # 6. Ingredients
    ingredients_data = [
        ("All-Purpose Flour", "Flour", 35.0, "kg", 10.0, 45.0, "Local Wholesale"),
        ("Cocoa Powder", "Chocolate", 8.0, "kg", 2.0, 650.0, "BakeSource"),
        ("Dark Chocolate", "Chocolate", 12.0, "kg", 3.0, 520.0, "Cocoa Kraft"),
        ("Compound Chocolate", "Chocolate", 15.0, "kg", 4.0, 380.0, "Cocoa Kraft"),
        ("Granulated Sugar", "Sugar", 40.0, "kg", 10.0, 48.0, "Sweet Supplies"),
        ("Unsalted Butter", "Dairy", 15.0, "kg", 5.0, 540.0, "Dairy Craft"),
        ("Fresh Cream", "Dairy", 20.0, "litre", 5.0, 220.0, "Amul Dairy"),
        ("Milk", "Dairy", 25.0, "litre", 5.0, 60.0, "Amul Dairy"),
        ("Fresh Eggs", "Dairy", 20.0, "dozen", 5.0, 84.0, "Poultry Farm"),
        ("Vanilla Essence", "Flavours", 500.0, "ml", 100.0, 1.5, "BakeSource"),
        ("Baking Powder", "Raising Agents", 5.0, "kg", 1.0, 180.0, "Local Wholesale"),
        ("Strawberries", "Fruits", 6.0, "kg", 2.0, 350.0, "Fresh Produce Co"),
        ("Blueberries", "Fruits", 3.0, "kg", 1.0, 900.0, "Fresh Produce Co"),
        ("Cream Cheese", "Dairy", 8.0, "kg", 2.0, 750.0, "Dairy Craft"),
        ("Fondant", "Decorating", 10.0, "kg", 2.0, 420.0, "SugarArt"),
        ("Edible Gold Foil", "Decorating", 50.0, "sheets", 10.0, 25.0, "SugarArt")
    ]
    ingredients = {}
    for name, cat, qty, unit, min_s, ucost, supp in ingredients_data:
        ing = Ingredient(
            name=name,
            category=cat,
            quantity=Decimal(str(qty)),
            unit=unit,
            min_stock=Decimal(str(min_s)),
            unit_cost=Decimal(str(ucost)),
            supplier=supp
        )
        db.add(ing)
        db.flush()
        ingredients[name] = ing
    print(f"Seeded {len(ingredients)} ingredients")

    # 7. Products & Recipes
    products_data = [
        {
            "name": "Belgian Chocolate Cake",
            "category": "Chocolate Cakes",
            "sku": "BK-CHO-001",
            "price": 1050.0,
            "manual_cost": 650.0,
            "use_manual_cost": False,
            "prep_time_hours": 2.5,
            "size": "1 Pound",
            "description": "Rich layers of moist Belgian chocolate sponge loaded with velvety chocolate ganache and chocolate curls.",
            "image_url": "/images/cakes/belgian-chocolate.jpg",
            "featured": True,
            "tags": ["Best Seller", "Chocolate", "Premium"],
            "sizes": [
                {"size": "500g (1 Pound)", "selling_price": 1050, "cost_price": 650},
                {"size": "1 kg (2 Pound)", "selling_price": 1950, "cost_price": 1150}
            ],
            "recipe_items": [
                ("All-Purpose Flour", 0.25, "kg"),
                ("Cocoa Powder", 0.08, "kg"),
                ("Dark Chocolate", 0.20, "kg"),
                ("Granulated Sugar", 0.20, "kg"),
                ("Unsalted Butter", 0.15, "kg"),
                ("Fresh Cream", 0.20, "litre"),
                ("Fresh Eggs", 0.33, "dozen"),
                ("Vanilla Essence", 10.0, "ml")
            ]
        },
        {
            "name": "Rose Pink 3-Tier Cake",
            "category": "Wedding Cakes",
            "sku": "BK-WED-001",
            "price": 4500.0,
            "manual_cost": 2200.0,
            "use_manual_cost": False,
            "prep_time_hours": 6.0,
            "size": "3 Tier (3.5 kg)",
            "description": "Exquisite 3-tier wedding masterpiece with edible rose petal accents, gold leaf finish, and Swiss meringue buttercream.",
            "image_url": "/images/cakes/wedding-hero.jpg",
            "featured": True,
            "tags": ["Wedding", "Grand Celebration", "Floral"],
            "sizes": [
                {"size": "3 Tier (3.5 kg)", "selling_price": 4500, "cost_price": 2200},
                {"size": "4 Tier (5 kg)", "selling_price": 6800, "cost_price": 3200}
            ],
            "recipe_items": [
                ("All-Purpose Flour", 1.0, "kg"),
                ("Granulated Sugar", 0.8, "kg"),
                ("Unsalted Butter", 0.6, "kg"),
                ("Fresh Cream", 0.8, "litre"),
                ("Fresh Eggs", 1.5, "dozen"),
                ("Vanilla Essence", 30.0, "ml"),
                ("Cream Cheese", 0.4, "kg"),
                ("Fondant", 0.5, "kg"),
                ("Edible Gold Foil", 5.0, "sheets")
            ]
        },
        {
            "name": "Mini Chocolate Bento Cake",
            "category": "Bento Cakes",
            "sku": "BK-BEN-001",
            "price": 450.0,
            "manual_cost": 220.0,
            "use_manual_cost": False,
            "prep_time_hours": 1.5,
            "size": "250g Mini Bento",
            "description": "Adorable Korean-style mini chocolate cake in cute lunchbox packaging, perfect for intimate birthdays and thank-yous.",
            "image_url": "/images/cakes/bento-floating.jpg",
            "featured": True,
            "tags": ["Bento", "Cute", "Trending"],
            "sizes": [
                {"size": "250g Bento", "selling_price": 450, "cost_price": 220}
            ],
            "recipe_items": [
                ("All-Purpose Flour", 0.1, "kg"),
                ("Cocoa Powder", 0.03, "kg"),
                ("Granulated Sugar", 0.08, "kg"),
                ("Unsalted Butter", 0.06, "kg"),
                ("Fresh Cream", 0.08, "litre")
            ]
        },
        {
            "name": "Classic Chocolate Truffle Cake",
            "category": "Chocolate Cakes",
            "sku": "BK-CHO-002",
            "price": 850.0,
            "manual_cost": 480.0,
            "use_manual_cost": False,
            "prep_time_hours": 2.0,
            "size": "1 Pound",
            "description": "Traditional Dutch chocolate truffle cake enveloped in silky smooth chocolate ganache glaze.",
            "image_url": "/images/cakes/celebration-platter.jpg",
            "featured": True,
            "tags": ["Best Seller", "Chocolate"],
            "sizes": [
                {"size": "1 Pound", "selling_price": 850, "cost_price": 480},
                {"size": "2 Pound", "selling_price": 1600, "cost_price": 900}
            ],
            "recipe_items": [
                ("All-Purpose Flour", 0.25, "kg"),
                ("Cocoa Powder", 0.06, "kg"),
                ("Compound Chocolate", 0.25, "kg"),
                ("Granulated Sugar", 0.20, "kg"),
                ("Fresh Cream", 0.20, "litre"),
                ("Unsalted Butter", 0.10, "kg")
            ]
        }
    ]

    products = {}
    for pdata in products_data:
        cat_obj = categories.get(pdata["category"])
        prod = Product(
            name=pdata["name"],
            sku=pdata["sku"],
            category_id=cat_obj.id if cat_obj else categories["All Cakes"].id,
            price=Decimal(str(pdata["price"])),
            manual_cost=Decimal(str(pdata["manual_cost"])),
            use_manual_cost=pdata["use_manual_cost"],
            prep_time_hours=Decimal(str(pdata["prep_time_hours"])),
            size=pdata["size"],
            description=pdata["description"],
            featured=pdata["featured"],
            tags=pdata["tags"],
            sizes=pdata["sizes"],
            image_url=pdata["image_url"],
            gallery_images=[pdata["image_url"]],
            availability=True,
            public_visibility=True,
            is_deleted=False
        )
        db.add(prod)
        db.flush()
        products[pdata["name"]] = prod

        # Add recipe
        recipe = Recipe(product_id=prod.id, notes=f"Artisan recipe formulation for {prod.name}")
        db.add(recipe)
        db.flush()

        for ing_name, req_qty, req_unit in pdata["recipe_items"]:
            if ing_name in ingredients:
                db.add(RecipeItem(
                    recipe_id=recipe.id,
                    ingredient_id=ingredients[ing_name].id,
                    quantity_required=Decimal(str(req_qty)),
                    unit=req_unit
                ))

    print(f"Seeded {len(products_data)} Bakelicious products & recipes")

    # 8. Clients
    clients_data = [
        ("Rahul Sharma", "+91 98112 34567", "rahul@gmail.com", "Flat 402, Park Street, Kolkata", "Prefers eggless options"),
        ("Priya Patel", "+91 98223 45678", "priya.p@yahoo.com", "House 12, Salt Lake Sector 5, Kolkata", "Regular birthday cake buyer"),
        ("Ananya Sen", "+91 98334 56789", "ananya@design.co", "Villa 8, New Town, Kolkata", "Corporate order client"),
        ("Vikram Roy", "+91 98445 67890", "vikram.roy@outlook.com", "24 Southern Avenue, Kolkata", "Prefers Belgian chocolate"),
        ("Sneha Chakraborty", "+91 98556 78901", "sneha.c@gmail.com", "15 Ballygunge Circular Rd, Kolkata", "Wedding cake inquiry")
    ]
    clients = []
    for name, ph, em, addr, nt in clients_data:
        c = Client(name=name, phone=ph, email=em, address=addr, notes=nt)
        db.add(c)
        db.flush()
        clients.append(c)
    print(f"Seeded {len(clients)} clients")

    # 9. Customer Feedback
    feedback_items = [
        {
            "customer_name": "Ananya Sen",
            "rating": 5,
            "review_text": "The Rose Pink 3-Tier wedding cake for our reception was absolute perfection! Not only was it breathtakingly beautiful, but the dark chocolate truffle layers melted in your mouth. Thank you Bakelicious!",
            "image_url": "/images/cakes/wedding-hero.jpg",
            "is_screenshot": False,
            "is_published": True
        },
        {
            "customer_name": "Priya Patel",
            "rating": 5,
            "review_text": "WhatsApp Review — 'Hey Bakelicious team! Everyone at the party loved the fresh fruit cream cake! So light and delicious! Will order again soon ❤️'",
            "image_url": "/images/feedback/whatsapp_review_1.png",
            "is_screenshot": True,
            "is_published": True
        },
        {
            "customer_name": "Vikram Roy",
            "rating": 5,
            "review_text": "Ordered the Belgian Chocolate Cake for my wife's birthday. Rich, velvety, and delivered right on time in Kolkata. Easily the best gourmet bakery in town!",
            "image_url": "/images/cakes/belgian-chocolate.jpg",
            "is_screenshot": False,
            "is_published": True
        }
    ]
    for fb in feedback_items:
        db.add(Feedback(**fb))

    # 10. Sample Orders & Assigned Production Tasks (for Dev Testing)
    if is_development and len(bakers_created) >= 2:
        now = datetime.now()
        baker_a = bakers_created[0]
        baker_b = bakers_created[1]

        # Order 1: Assigned to Baker A (Rahul) -> Baking
        c_belgian = products.get("Belgian Chocolate Cake")
        o1 = Order(
            order_number="ORD-1001",
            client_id=clients[0].id,
            order_date=now,
            delivery_date=now + timedelta(hours=5),
            delivery_time="6:00 PM",
            subtotal=Decimal("1050.00"),
            discount=Decimal("50.00"),
            final_amount=Decimal("1000.00"),
            advance_paid=Decimal("500.00"),
            remaining_paid=Decimal("500.00"),
            payment_status="Partial",
            order_status="Baking",
            special_instructions="Write 'Happy Birthday Rahul!' on cake",
            delivery_address=clients[0].address
        )
        db.add(o1)
        db.flush()
        if c_belgian:
            db.add(OrderItem(order_id=o1.id, product_id=c_belgian.id, quantity=1, unit_price=Decimal("1050.00"), subtotal=Decimal("1050.00")))
        db.add(Production(
            order_id=o1.id,
            production_date=now,
            delivery_date=o1.delivery_date,
            status="Baking",
            priority="High",
            assigned_to_id=baker_a.id,
            assigned_by_id=admin.id,
            assigned_at=now,
            notes="Assigned to Baker Rahul. Customer requested extra dark ganache."
        ))

        # Order 2: Assigned to Baker B (Priya) -> Decorating
        c_wedding = products.get("Rose Pink 3-Tier Cake")
        o2 = Order(
            order_number="ORD-1002",
            client_id=clients[2].id,
            order_date=now,
            delivery_date=now + timedelta(days=1),
            delivery_time="3:00 PM",
            subtotal=Decimal("4500.00"),
            discount=Decimal("0.00"),
            final_amount=Decimal("4500.00"),
            advance_paid=Decimal("4500.00"),
            remaining_paid=Decimal("0.00"),
            payment_status="Paid",
            order_status="Decorating",
            special_instructions="Rose pink ombre with gold leaf",
            delivery_address=clients[2].address
        )
        db.add(o2)
        db.flush()
        if c_wedding:
            db.add(OrderItem(order_id=o2.id, product_id=c_wedding.id, quantity=1, unit_price=Decimal("4500.00"), subtotal=Decimal("4500.00")))
        db.add(Production(
            order_id=o2.id,
            production_date=now,
            delivery_date=o2.delivery_date,
            status="Decorating",
            priority="Urgent",
            assigned_to_id=baker_b.id,
            assigned_by_id=admin.id,
            assigned_at=now,
            notes="Assigned to Baker Priya. Wedding reception in New Town."
        ))

        # Order 3: Unassigned -> Preparing
        c_bento = products.get("Mini Chocolate Bento Cake")
        o3 = Order(
            order_number="ORD-1003",
            client_id=clients[1].id,
            order_date=now,
            delivery_date=now + timedelta(hours=3),
            delivery_time="4:00 PM",
            subtotal=Decimal("450.00"),
            discount=Decimal("0.00"),
            final_amount=Decimal("450.00"),
            advance_paid=Decimal("450.00"),
            remaining_paid=Decimal("0.00"),
            payment_status="Paid",
            order_status="Preparing",
            delivery_address=clients[1].address
        )
        db.add(o3)
        db.flush()
        if c_bento:
            db.add(OrderItem(order_id=o3.id, product_id=c_bento.id, quantity=1, unit_price=Decimal("450.00"), subtotal=Decimal("450.00")))
        db.add(Production(
            order_id=o3.id,
            production_date=now,
            delivery_date=o3.delivery_date,
            status="Preparing",
            priority="Normal",
            assigned_to_id=None,
            notes="Unassigned bento order queue."
        ))

        # Sample Expenses
        e1 = Expense(name="Butter & Dairy Bulk Ingestion", category="Ingredients", amount=Decimal("4200.00"), expense_date=now - timedelta(days=6), description="15kg butter & 20L fresh cream")
        e2 = Expense(name="Bakery Packaging Boxes & Boards", category="Packaging", amount=Decimal("2500.00"), expense_date=now - timedelta(days=4), description="Custom printed boxes and tier boards")
        db.add(e1)
        db.add(e2)

        print("Seeded sample development orders, assigned productions, & expenses")

    db.commit()
    db.close()

if __name__ == "__main__":
    copy_logo_files()
    seed_database(is_development=True)
    print("RBAC Database seeding completed successfully!")
