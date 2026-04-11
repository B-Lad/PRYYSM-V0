from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter()

@router.get("/overview/machines")
async def get_machines(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM machines WHERE tenant_id = 'comp_a1b2c3' ORDER BY id"))
    return [dict(r) for r in result.mappings().all()]

@router.get("/projects")
async def get_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM projects WHERE tenant_id = 'comp_a1b2c3' ORDER BY id"))
    return [dict(r) for r in result.mappings().all()]

@router.get("/work-orders")
async def get_work_orders(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM work_orders WHERE tenant_id = 'comp_a1b2c3' ORDER BY id"))
    return [dict(r) for r in result.mappings().all()]

@router.get("/requests")
async def get_requests(db: AsyncSession = Depends(get_db)):
    return []

@router.post("/requests")
async def create_request(db: AsyncSession = Depends(get_db)):
    return {"id": "REQ-NEW", "status": "submitted", "tenant_id": "comp_a1b2c3"}

@router.get("/users")
async def get_tenant_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT id, email, name, role FROM users WHERE tenant_id = 'comp_a1b2c3'"))
    return [dict(r) for r in result.mappings().all()]
