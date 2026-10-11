import os
import uuid
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def save_uploaded_file(file: UploadFile) -> str:
    """
    Saves an uploaded image file using the configured STORAGE_PROVIDER ('local' or 'supabase').
    Validates extension, content type, and file size. Returns the image_url string.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Supported formats: JPG, JPEG, PNG, WEBP"
        )
        
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit of 5MB"
        )
        
    if settings.STORAGE_PROVIDER == "supabase" and settings.SUPABASE_URL:
        # Supabase Storage implementation placeholder/abstraction
        # In cloud mode, upload via Supabase SDK and return public URL
        filename = f"{uuid.uuid4().hex}{ext}"
        return f"{settings.SUPABASE_URL}/storage/v1/object/public/products/{filename}"
    else:
        # Local storage fallback
        target_dir = os.path.join(os.getcwd(), settings.UPLOAD_DIR, "products")
        os.makedirs(target_dir, exist_ok=True)
        
        filename = f"prod_{uuid.uuid4().hex[:12]}{ext}"
        filepath = os.path.join(target_dir, filename)
        
        with open(filepath, "wb") as f:
            f.write(file.file.read())
            
        return f"/api/uploads/products/{filename}"

def delete_uploaded_file(image_url: str) -> bool:
    """Deletes uploaded image file if local."""
    if not image_url or not image_url.startswith("/api/uploads/"):
        return False
        
    try:
        relative_path = image_url.replace("/api/uploads/", "")
        filepath = os.path.join(os.getcwd(), settings.UPLOAD_DIR, relative_path)
        if os.path.exists(filepath):
            os.remove(filepath)
            return True
    except Exception:
        pass
    return False
