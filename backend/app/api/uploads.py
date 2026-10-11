from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.storage_service import save_uploaded_file, delete_uploaded_file
from app.models.user import User
from app.auth.permissions import require_any_permission

router = APIRouter(prefix="/uploads", tags=["Uploads"])

@router.post("/image")
def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_any_permission(["MEDIA_UPLOAD", "PRODUCTS_CREATE", "PRODUCTS_EDIT", "FEEDBACK_CREATE"]))
):
    """
    Directly upload a product or business image file.
    Supports JPG, JPEG, PNG, WEBP.
    """
    image_url = save_uploaded_file(file)
    return {
        "success": True,
        "image_url": image_url,
        "filename": file.filename
    }

@router.delete("/image")
def remove_image(
    image_url: str,
    current_user: User = Depends(require_any_permission(["MEDIA_DELETE", "PRODUCTS_DELETE"]))
):
    success = delete_uploaded_file(image_url)
    return {"success": success}
