from pydantic import BaseModel
from typing import List
from app.models.tenant import Role

class InviteMember(BaseModel):
    email: str
    role: Role = Role.VIEWER

class MemberOut(BaseModel):
    id: str
    user_id: str
    email: str
    role: Role
    class Config: from_attributes = True

class TenantOut(BaseModel):
    id: str
    name: str
    members: List[MemberOut] = []
    class Config: from_attributes = True