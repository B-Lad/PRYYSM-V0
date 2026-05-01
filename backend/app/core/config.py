import os
from typing import List, Optional
from dotenv import load_dotenv

# Automatically load variables from .env file
load_dotenv()


def _parse_cors_origins() -> List[str]:
    """Read CORS origins from env var (comma-separated) or use defaults."""
    env_origins = os.getenv("CORS_ORIGINS", "")
    if env_origins:
        return [o.strip() for o in env_origins.split(",") if o.strip()]
    return [
        "https://pryysm-v0.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:8080",
    ]


class Settings:
    APP_NAME: str = "Pryysm MES v3.0"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./test.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-change-in-prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    CORS_ORIGINS: List[str] = [
        "https://www.pryysm.app",
        "https://pryysm-v0.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:8080",
    ]
    CORS_ORIGIN_REGEX: str = r"https://.*\.(vercel\.app|pryysm\.app)"


settings = Settings()
