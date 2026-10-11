from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.category import CategoryResponse
from app.schemas.recipe import RecipeResponse

class ProductBase(BaseModel):
    category_id: int
    name: str
    sku: Optional[str] = None
    description: Optional[str] = None
    price: float
    manual_cost: Optional[float] = 0.0
    use_manual_cost: bool = False
    prep_time_hours: float = 1.0
    size: Optional[str] = None
    availability: bool = True
    featured: bool = False
    public_visibility: bool = True
    tags: Optional[List[str]] = []
    sizes: Optional[List[dict]] = []
    image_url: Optional[str] = None
    gallery_images: Optional[List[str]] = []

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    manual_cost: Optional[float] = None
    use_manual_cost: Optional[bool] = None
    prep_time_hours: Optional[float] = None
    size: Optional[str] = None
    availability: Optional[bool] = None
    featured: Optional[bool] = None
    public_visibility: Optional[bool] = None
    tags: Optional[List[str]] = None
    sizes: Optional[List[dict]] = None
    image_url: Optional[str] = None
    gallery_images: Optional[List[str]] = None

class PublicProductSize(BaseModel):
    size: str
    selling_price: float

class PublicProductResponse(BaseModel):
    id: int
    category_id: int
    name: str
    description: Optional[str] = None
    price: float
    prep_time_hours: float = 1.0
    size: Optional[str] = None
    availability: bool = True
    featured: bool = False
    public_visibility: bool = True
    tags: Optional[List[str]] = []
    sizes: Optional[List[PublicProductSize]] = []
    image_url: Optional[str] = None
    gallery_images: Optional[List[str]] = []
    category: Optional[CategoryResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ERPProductResponse(ProductBase):
    id: int
    category: Optional[CategoryResponse] = None
    recipe: Optional[RecipeResponse] = None
    
    # Financial breakdown computed by service for ERP admins only
    calculated_cost: float = 0.0
    effective_cost: float = 0.0
    profit: float = 0.0
    profit_margin: float = 0.0
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Alias for backwards compatibility
ProductResponse = ERPProductResponse
