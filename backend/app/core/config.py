import os
import re
from typing import List, Optional
from dotenv import load_dotenv

# Automatically load variables from .env file (tries common locations)
_dotenv_paths = [
    os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
    os.path.join(os.path.dirname(__file__), "..", ".env"),
    os.path.join(os.getcwd(), ".env"),
]
for _p in _dotenv_paths:
    if os.path.isfile(_p):
        load_dotenv(_p)
        break


def _require_env(name: str) -> str:
    """Raise a clear error if a required environment variable is missing."""
    value = os.getenv(name)
    if not value:
        raise ValueError(
            f"Required environment variable '{name}' is not set. "
            f"Please define it in your .env file or environment."
        )
    return value


def _parse_cors_origins() -> List[str]:
    """Read CORS origins from env var (comma-separated).

    Production deployments should set CORS_ORIGINS explicitly.
    No localhost defaults are baked in.
    """
    env_origins = os.getenv("CORS_ORIGINS", "")
    origins = [o.strip() for o in env_origins.split(",") if o.strip()]
    if not origins:
        raise ValueError(
            "CORS_ORIGINS is not set. Provide a comma-separated list of allowed origins."
        )
    return origins


class Settings:
    APP_NAME: str = "Pryysm MES v3.0"

    # --- Required secrets / infrastructure ---
    DATABASE_URL: str = _require_env("DATABASE_URL")
    SECRET_KEY: str = _require_env("SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # --- Supabase (optional; only required if using Supabase-specific features) ---
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

    # --- Optional integrations ---
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")

    # --- CORS ---
    CORS_ORIGINS: List[str] = _parse_cors_origins()
    # Restrictive regex: only exact pryysm.app subdomains and specific Vercel deploys.
    # Update VERCEL_DEPLOY_PREFIX if you need to allow preview deploys dynamically.
    CORS_ORIGIN_REGEX: str = r"https://([a-z0-9-]+\.)?pryysm\.app"


settings = Settings()
