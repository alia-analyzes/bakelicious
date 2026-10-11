from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.order import Order
from app.models.ingredient import Ingredient
from app.models.inventory import InventoryTransaction
from app.models.setting import Setting

def deduct_inventory_for_order(order: Order, db: Session) -> bool:
    """
    Deducts raw material ingredients from inventory based on order items and recipes.
    Checks if auto-inventory deduction setting is enabled and if order hasn't already been deducted.
    """
    # Check setting
    auto_deduct_setting = db.query(Setting).filter(Setting.key == "auto_inventory_deduct").first()
    if auto_deduct_setting and not auto_deduct_setting.value:
        return False
        
    if order.inventory_deducted:
        return False # Prevent duplicate deduction
        
    deducted_any = False
    for order_item in order.items:
        product = order_item.product
        if product and product.recipe and product.recipe.recipe_items:
            qty_multiplier = Decimal(str(order_item.quantity))
            for recipe_item in product.recipe.recipe_items:
                ingredient = recipe_item.ingredient
                if ingredient:
                    total_required = Decimal(str(recipe_item.quantity_required)) * qty_multiplier
                    
                    # Update ingredient stock
                    ingredient.quantity = Decimal(str(ingredient.quantity)) - total_required
                    
                    # Record transaction
                    transaction = InventoryTransaction(
                        ingredient_id=ingredient.id,
                        type="PRODUCTION_CONSUMPTION",
                        quantity_change=-total_required,
                        unit_cost_at_time=ingredient.unit_cost,
                        reference_id=f"Order #{order.order_number}",
                        notes=f"Auto-deduction for {order_item.quantity}x {product.name}"
                    )
                    db.add(transaction)
                    deducted_any = True
                    
    order.inventory_deducted = True
    db.commit()
    return deducted_any
