from pydantic_settings import BaseSettings
from typing import Optional


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

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
