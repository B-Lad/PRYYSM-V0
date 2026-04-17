from pydantic_settings import BaseSettings
from typing import Optional
from pydantic import field_validator


class Settings(BaseSettings):
    APP_NAME: str = "Pryysm MES v3.0"
    DATABASE_URL: str = (
        "postgresql://postgres:postgres@localhost:5432/pryysm_db"
    )
    SECRET_KEY: str = "dev-secret-change-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    OPENAI_API_KEY: Optional[str] = None
    CORS_ORIGINS: list[str] = [
        "https://pryysm-v0.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
    ]
    CORS_ORIGIN_REGEX: str = r"https://.*\.vercel\.app"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
