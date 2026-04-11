from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.auth import router as auth_router
from app.api.v1.tenant import router as tenant_router
from app.api.v1.users import router as users_router
from app.api.v1.operations import router as operations_router
from app.api.v1.admin import router as admin_router
from app.api.v1.ai import router as ai_router
from app.api.v1.websocket import router as websocket_router
from app.api.v1.permissions import router as permissions_router
from app.core.database import init_db

app = FastAPI(title="Pryysm MES API", version="3.0.0")

# CORS - allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    """Initialize database on startup"""
    await init_db()


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "3.0.0"}


# Register API routes
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(tenant_router, prefix="/api/v1/tenant", tags=["Tenant"])
app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])
app.include_router(operations_router, prefix="/api/v1/operations", tags=["Operations"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(ai_router, prefix="/api/v1/ai", tags=["AI"])
app.include_router(websocket_router, prefix="/api/v1/ws", tags=["WebSocket"])
app.include_router(permissions_router, prefix="/api/v1/permissions", tags=["Permissions"])
