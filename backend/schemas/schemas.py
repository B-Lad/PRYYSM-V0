from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# --- Enums ---
class TechType(str, Enum):
    FDM = "FDM"
    SLA = "SLA"
    SLS = "SLS"

class Priority(str, Enum):
    normal = "normal"
    high = "high"
    urgent = "urgent"

# --- Project Schemas ---
class ProjectBase(BaseModel):
    name: str
    dept: Optional[str] = None
    priority: Priority = Priority.normal
    budget: Optional[float] = None
    due_date: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectOut(ProjectBase):
    id: str
    custom_id: str
    status: str = "active"
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# --- Work Order Schemas ---
class WOCreate(BaseModel):
    project_id: str
    part_name: str
    tech: Optional[TechType] = None
    material: Optional[str] = None
    qty: int = 1
    due_date: Optional[str] = None

class WOOut(BaseModel):
    id: str
    custom_id: str
    project_id: str
    part_name: str
    tech: Optional[str] = None
    material: Optional[str] = None
    qty: int
    status: str = "planned"
    machine_id: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True

# --- Machine Schemas ---
class MachineOut(BaseModel):
    id: str
    custom_id: str
    name: str
    tech: Optional[str] = None
    status: str = "idle"
    current_job: Optional[str] = None
    progress_pct: float = 0.0
    oee: float = 0.0

    class Config:
        orm_mode = True

# --- Inventory Schemas ---
class MaterialInventoryCreate(BaseModel):
    name: str
    brand: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None
    quantity: float
    min_quantity: float = 5.0
    location: Optional[str] = None

class MaterialInventoryOut(BaseModel):
    id: str
    custom_id: str
    name: str
    brand: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None
    color_hex: Optional[str] = None
    unit: str = "spools"
    quantity: float
    min_quantity: float
    location: Optional[str] = None

    class Config:
        orm_mode = True

# --- NCR Schemas ---
class NCRCreate(BaseModel):
    related_wo_id: Optional[str] = None
    description: str
    root_cause_analysis: Optional[Dict[str, Any]] = None
    corrective_action: Optional[str] = None
    cost_impact: float = 0.0

class NCRBase(BaseModel):
    id: str
    custom_id: str
    description: str
    status: str = "open"
    created_at: datetime
    class Config: orm_mode = True
