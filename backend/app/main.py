import os
import uuid

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.limiter import limiter
from app.core.logging_config import get_logger, setup_logging

# Setup logging immediately on import
setup_logging(os.getenv("LOG_LEVEL", "INFO"))
logger = get_logger(__name__)

app = FastAPI(
    title="Pryysm MES API v3.0.0",
    version="3.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# Import your routers
from app.api.v1.auth import router as auth_router
from app.api.v1.operations import router as operations_router
from app.api.v1.admin import router as admin_router
from app.api.v1.permissions import router as permissions_router

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(operations_router, prefix="/api/v1/operations", tags=["Operations"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(
    permissions_router, prefix="/api/v1/permissions", tags=["Permissions"]
)


# ------------------------------------------------------------------------------
# Startup validation
# ------------------------------------------------------------------------------
@app.on_event("startup")
def startup_validation() -> None:
    """Run cheap sanity checks on startup."""
    logger.info("Running startup validation...")

    # 1. Secret key strength
    if len(settings.SECRET_KEY) < 32:
        logger.error("SECRET_KEY is too short (< 32 chars). Refusing to start.")
        raise RuntimeError("SECRET_KEY must be at least 32 characters")

    # 2. Database URL scheme
    if not settings.DATABASE_URL.startswith("postgresql"):
        logger.error("DATABASE_URL must use postgresql:// or postgresql+asyncpg://")
        raise RuntimeError("Only PostgreSQL is supported in production")

    logger.info("Startup validation passed")


# ------------------------------------------------------------------------------
# Security headers middleware
# ------------------------------------------------------------------------------
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = (
        "max-age=63072000; includeSubDomains"
    )
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# ------------------------------------------------------------------------------
# Request ID middleware (for tracing)
# ------------------------------------------------------------------------------
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    logger.info("[%s] %s %s", request_id, request.method, request.url.path)
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# ------------------------------------------------------------------------------
# Global exception handler (sanitizes 500s)
# ------------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception at %s", request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )


# ------------------------------------------------------------------------------
# Health / Readiness
# ------------------------------------------------------------------------------
@limiter.limit("60/minute")
@app.get("/health")
def health_check(request: Request) -> dict:
    """Liveness probe. Returns quickly."""
    return {"status": "healthy"}


@limiter.limit("30/minute")
@app.get("/ready")
def readiness_check(request: Request) -> JSONResponse:
    """Readiness probe. Verifies database connectivity."""
    try:
        db: Session = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return JSONResponse(
            content={"status": "ready", "db": "connected"},
            status_code=status.HTTP_200_OK,
        )
    except Exception as exc:
        logger.warning("Readiness check failed: %s", exc)
        return JSONResponse(
            content={"status": "not_ready", "db": "unreachable"},
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
