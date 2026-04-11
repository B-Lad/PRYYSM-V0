from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from db.models import Project, WorkOrder, Machine, MaterialInventory, NCRReport
from schemas.schemas import (
    ProjectCreate, ProjectOut, 
    WOCreate, WOOut, 
    MachineOut, 
    MaterialInventoryCreate, MaterialInventoryOut,
    NCRCreate, NCRBase
)
import uuid

router = APIRouter()

# ==============================================================================
# PROJECTS
# ==============================================================================

@router.get("/projects", response_model=List[ProjectOut])
def get_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # In a real app, you'd filter by tenant_id here using the current user's tenant
    projects = db.query(Project).offset(skip).limit(limit).all()
    return projects

@router.post("/projects", response_model=ProjectOut)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    # Generate Custom ID logic would go here (or handled by DB trigger)
    custom_id = f"PRJ-{str(uuid.uuid4())[:4].upper()}"
    
    db_project = Project(
        id=str(uuid.uuid4()),
        custom_id=custom_id,
        tenant_id="00000000-0000-0000-0000-000000000001", # TODO: Get from user session
        name=project.name,
        dept=project.dept,
        priority=project.priority.value,
        budget=project.budget,
        due_date=project.due_date
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

# ==============================================================================
# WORK ORDERS
# ==============================================================================

@router.get("/work-orders", response_model=List[WOOut])
def get_work_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(WorkOrder).offset(skip).limit(limit).all()

@router.post("/work-orders", response_model=WOOut)
def create_wo(wo: WOCreate, db: Session = Depends(get_db)):
    custom_id = f"WO-{str(uuid.uuid4())[:4].upper()}"
    db_wo = WorkOrder(
        id=str(uuid.uuid4()),
        custom_id=custom_id,
        tenant_id="00000000-0000-0000-0000-000000000001", # TODO: Get from user session
        project_id=wo.project_id,
        part_name=wo.part_name,
        tech=wo.tech,
        material=wo.material,
        qty=wo.qty,
        due_date=wo.due_date
    )
    db.add(db_wo)
    db.commit()
    db.refresh(db_wo)
    return db_wo

# ==============================================================================
# MACHINES
# ==============================================================================

@router.get("/machines", response_model=List[MachineOut])
def get_machines(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Machine).offset(skip).limit(limit).all()

@router.put("/machines/{machine_id}")
def update_machine_status(machine_id: str, status: str, db: Session = Depends(get_db)):
    machine = db.query(Machine).filter(Machine.custom_id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    machine.status = status
    db.commit()
    db.refresh(machine)
    return {"status": "updated", "machine": machine.name}

# ==============================================================================
# INVENTORY
# ==============================================================================

@router.get("/inventory/materials", response_model=List[MaterialInventoryOut])
def get_materials(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(MaterialInventory).offset(skip).limit(limit).all()

@router.post("/inventory/materials", response_model=MaterialInventoryOut)
def add_material(mat: MaterialInventoryCreate, db: Session = Depends(get_db)):
    custom_id = f"MAT-{str(uuid.uuid4())[:4].upper()}"
    db_mat = MaterialInventory(
        id=str(uuid.uuid4()),
        custom_id=custom_id,
        tenant_id="00000000-0000-0000-0000-000000000001", # TODO: Get from user session
        name=mat.name,
        brand=mat.brand,
        type=mat.type,
        color=mat.color,
        quantity=mat.quantity,
        min_quantity=mat.min_quantity,
        location=mat.location
    )
    db.add(db_mat)
    db.commit()
    db.refresh(db_mat)
    return db_mat

# ==============================================================================
# NCR (QUALITY)
# ==============================================================================

@router.get("/quality/ncr", response_model=List[NCRBase])
def get_ncrs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(NCRReport).offset(skip).limit(limit).all()

@router.post("/quality/ncr", response_model=NCRBase)
def create_ncr(ncr: NCRCreate, db: Session = Depends(get_db)):
    custom_id = f"NCR-{str(uuid.uuid4())[:4].upper()}"
    db_ncr = NCRReport(
        id=str(uuid.uuid4()),
        custom_id=custom_id,
        tenant_id="00000000-0000-0000-0000-000000000001", # TODO: Get from user session
        description=ncr.description,
        root_cause_analysis=ncr.root_cause_analysis,
        corrective_action=ncr.corrective_action,
        cost_impact=ncr.cost_impact
    )
    db.add(db_ncr)
    db.commit()
    db.refresh(db_ncr)
    return db_ncr
