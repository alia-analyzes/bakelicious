from decimal import Decimal
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.product import Product

def calculate_product_cost(product: Product, db: Session) -> Dict[str, Any]:
    """
    Calculates calculated ingredient cost, effective cost, profit, and profit margin for a product.
    Respects manual_cost override if use_manual_cost is True.
    """
    calculated_cost = Decimal("0.00")
    
    if product.recipe and product.recipe.recipe_items:
        for item in product.recipe.recipe_items:
            if item.ingredient:
                item_cost = Decimal(str(item.quantity_required)) * Decimal(str(item.ingredient.unit_cost))
                calculated_cost += item_cost
                
    price = Decimal(str(product.price or "0.00"))
    
    if product.use_manual_cost and product.manual_cost is not None:
        effective_cost = Decimal(str(product.manual_cost))
    else:
        effective_cost = calculated_cost
        
    profit = price - effective_cost
    margin = (profit / price * Decimal("100")) if price > 0 else Decimal("0.00")
    
    return {
        "price": float(price),
        "calculated_cost": float(calculated_cost),
        "manual_cost": float(product.manual_cost or 0.00),
        "use_manual_cost": product.use_manual_cost,
        "effective_cost": float(effective_cost),
        "profit": float(profit),
        "profit_margin": float(round(margin, 2))
    }
