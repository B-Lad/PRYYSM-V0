from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.access import get_user_tabs, normalize_tenant_settings
from app.core.database import get_db
from app.core.dependencies import CurrentTenant
from db.models import MaterialInventory, Machine, NCRReport, Project, Tenant, User, WorkOrder
from schemas.schemas import (
    MaterialInventoryCreate,
    MaterialInventoryOut,
    MachineOut,
    NCRBase,
    NCRCreate,
    ProjectCreate,
    ProjectOut,
    WOCreate,
    WOOut,
)
import uuid

router = APIRouter()


def ensure_tenant(ctx: CurrentTenant):
    if not ctx.tenant_id:
        raise HTTPException(status_code=400, detail="No company is assigned to this user")


def ensure_section_access(db: Session, ctx: CurrentTenant, section_ids):
    if ctx.role in {"super_admin", "admin"}:
        return

    user = db.query(User).filter(User.id == ctx.user_id).first()
    tenant = db.query(Tenant).filter(Tenant.id == ctx.tenant_id).first()
    settings = normalize_tenant_settings(tenant.settings if tenant else {})
    allowed_tabs = get_user_tabs(settings, user.id if user else ctx.user_id, ctx.role)

    if not any(section_id in allowed_tabs for section_id in section_ids):
        raise HTTPException(status_code=403, detail="You do not have access to this section")


@router.get("/projects", response_model=List[ProjectOut])
def get_projects(
    ctx: CurrentTenant, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    ensure_tenant(ctx)
    ensure_section_access(db, ctx, ["projects", "requests", "amreview", "repository"])
    return (
        db.query(Project)
        .filter(Project.tenant_id == ctx.tenant_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/projects", response_model=ProjectOut)
def create_project(
    project: ProjectCreate, ctx: CurrentTenant, db: Session = Depends(get_db)
):
    ensure_tenant(ctx)
    ensure_section_access(db, ctx, ["projects"])
    custom_id = f"PRJ-{str(uuid.uuid4())[:4].upper()}"

    db_project = Project(
        id=str(uuid.uuid4()),
        custom_id=custom_id,
        tenant_id=ctx.tenant_id,
        name=project.name,
        dept=project.dept,
        priority=project.priority.value,
        budget=project.budget,
        due_date=project.due_date,
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.get("/work-orders", response_model=List[WOOut])
def get_work_orders(
    ctx: CurrentTenant, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    ensure_tenant(ctx)
    ensure_section_access(db, ctx, ["projects", "schedule", "allotment"])
    return (
        db.query(WorkOrder)
        .filter(WorkOrder.tenant_id == ctx.tenant_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/work-orders", response_model=WOOut)
def create_wo(wo: WOCreate, ctx: CurrentTenant, db: Session = Depends(get_db)):
    ensure_tenant(ctx)
    ensure_section_access(db, ctx, ["projects", "schedule"])

    # Verify project exists and belongs to tenant
    project = db.query(Project).filter(
        Project.id == wo.project_id, Project.tenant_id == ctx.tenant_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    custom_id = f"WO-{str(uuid.uuid4())[:4].upper()}"
    db_wo = WorkOrder(
        id=str(uuid.uuid4()),
        custom_id=custom_id,
        tenant_id=ctx.tenant_id,
        project_id=wo.project_id,
        part_name=wo.part_name,
        tech=wo.tech,
        material=wo.material,
        qty=wo.qty,
        due_date=wo.due_date,
    )
    db.add(db_wo)
    db.commit()
    db.refresh(db_wo)
    return db_wo


@router.get("/machines", response_model=List[MachineOut])
def get_machines(
    ctx: CurrentTenant, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    ensure_tenant(ctx)
    ensure_section_access(db, ctx, ["fleet", "overview"])
    return (
        db.query(Machine)
        .filter(Machine.tenant_id == ctx.tenant_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.put("/machines/{machine_id}")
def update_machine_status(
    machine_id: str, status: str, ctx: CurrentTenant, db: Session = Depends(get_db)
):
    ensure_tenant(ctx)
    ensure_section_access(db, ctx, ["fleet"])
    machine = (
        db.query(Machine)
        .filter(Machine.custom_id == machine_id, Machine.tenant_id == ctx.tenant_id)
        .first()
    )
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    machine.status = status
    db.commit()
    db.refresh(machine)
    return {"status": "updated", "machine": machine.name}


@router.get("/inventory/materials", response_model=List[MaterialInventoryOut])
def get_materials(
    ctx: CurrentTenant, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    ensure_tenant(ctx)
    ensure_section_access(db, ctx, ["rawmat"])
    return (
        db.query(MaterialInventory)
        .filter(MaterialInventory.tenant_id == ctx.tenant_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/inventory/materials", response_model=MaterialInventoryOut)
def add_material(
    mat: MaterialInventoryCreate, ctx: CurrentTenant, db: Session = Depends(get_db)
):
    ensure_tenant(ctx)
    ensure_section_access(db, ctx, ["rawmat"])
    custom_id = f"MAT-{str(uuid.uuid4())[:4].upper()}"
    db_mat = MaterialInventory(
        id=str(uuid.uuid4()),
        custom_id=custom_id,
        tenant_id=ctx.tenant_id,
        name=mat.name,
        brand=mat.brand,
        type=mat.type,
        color=mat.color,
        quantity=mat.quantity,
        min_quantity=mat.min_quantity,
        location=mat.location,
    )
    db.add(db_mat)
    db.commit()
    db.refresh(db_mat)
    return db_mat


@router.get("/quality/ncr", response_model=List[NCRBase])
def get_ncrs(
    ctx: CurrentTenant, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    ensure_tenant(ctx)
    ensure_section_access(db, ctx, ["postposing"])
    return (
        db.query(NCRReport)
        .filter(NCRReport.tenant_id == ctx.tenant_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/quality/ncr", response_model=NCRBase)
def create_ncr(ncr: NCRCreate, ctx: CurrentTenant, db: Session = Depends(get_db)):
    ensure_tenant(ctx)
    ensure_section_access(db, ctx, ["postposing"])

    # Verify related work order exists and belongs to tenant
    if ncr.related_wo_id:
        wo = db.query(WorkOrder).filter(
            WorkOrder.id == ncr.related_wo_id, WorkOrder.tenant_id == ctx.tenant_id
        ).first()
        if not wo:
            raise HTTPException(status_code=404, detail="Work order not found")

    custom_id = f"NCR-{str(uuid.uuid4())[:4].upper()}"
    db_ncr = NCRReport(
        id=str(uuid.uuid4()),
        custom_id=custom_id,
        tenant_id=ctx.tenant_id,
        related_wo_id=ncr.related_wo_id,
        description=ncr.description,
        root_cause_analysis=ncr.root_cause_analysis,
        corrective_action=ncr.corrective_action,
        cost_impact=ncr.cost_impact,
    )
    db.add(db_ncr)
    db.commit()
    db.refresh(db_ncr)
    return db_ncr
