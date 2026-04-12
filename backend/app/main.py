This error is happening because your backend has CORS (Cross-Origin Resource Sharing) security turned on by default, blocking requests from your local computer.

We need to tell FastAPI to allow your frontend to talk to it.

🛠️ Step 1: Update backend/app/main.py
Open backend/app/main.py and replace the content with this. It adds the “Allow all” policy for now so you can develop easily.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import your routers
from app.api.v1.auth import router as auth_router
from app.api.v1.operations import router as operations_router
from app.api.v1.admin import router as admin_router
from app.api.v1.permissions import router as permissions_router

app = FastAPI(title="Pryysm MES API v3.0.0")

# --- THIS IS THE FIX FOR THE CORS ERROR ---
origins = [
    "http://localhost:5173",      # Local Frontend
    "http://localhost:3000",
    "https://pryysm-v0.onrender.com", # Backend itself
    # Add your Vercel URL here later when deployed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ------------------------------------------

# Include Routes
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(operations_router, prefix="/api/v1/operations", tags=["Operations"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(permissions_router, prefix="/api/v1/permissions", tags=["Permissions"])

@app.get("/health")
def health_check():
    return {"status": "healthy", "db": "connected"}

# Optional: Mount other routers if you have them
# app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])