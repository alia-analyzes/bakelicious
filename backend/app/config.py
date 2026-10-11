import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Bakelicious ERP"
    API_V1_STR: str = "/api"
    
    SECRET_KEY: str = "bakelicious-secret-key-super-secure-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    DATABASE_URL: str = "sqlite:///./bakelicious.db"
    
    STORAGE_PROVIDER: str = "local"  # 'local' or 'supabase'
    UPLOAD_DIR: str = "uploads"
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    
    BACKEND_URL: str = "http://localhost:8000"
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
