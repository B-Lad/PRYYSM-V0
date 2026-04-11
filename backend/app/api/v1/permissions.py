from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from app.core.dependencies import CurrentTenant

router = APIRouter()

# Default permission matrix
DEFAULT_PERMISSIONS = {
    "AM Admin": {
        "submit_request": True,
        "approve_requests": True,
        "schedule_wos": True,
        "view_all_projects": True,
        "configure_system": True,
        "log_downtime": True,
    },
    "Coordinator": {
        "submit_request": True,
        "approve_requests": True,
        "schedule_wos": True,
        "view_all_projects": True,
        "configure_system": False,
        "log_downtime": True,
    },
    "Operator": {
        "submit_request": False,
        "approve_requests": False,
        "schedule_wos": False,
        "view_all_projects": True,
        "configure_system": False,
        "log_downtime": True,
    },
    "QA": {
        "submit_request": False,
        "approve_requests": False,
        "schedule_wos": False,
        "view_all_projects": True,
        "configure_system": False,
        "log_downtime": True,
    },
    "Requestor": {
        "submit_request": True,
        "approve_requests": False,
        "schedule_wos": False,
        "view_all_projects": False,
        "configure_system": False,
        "log_downtime": False,
    },
    "Manager": {
        "submit_request": True,
        "approve_requests": True,
        "schedule_wos": False,
        "view_all_projects": True,
        "configure_system": False,
        "log_downtime": False,
    },
}

# Available permissions for UI
PERMISSIONS_SCHEMA = [
    {"key": "submit_request", "label": "Submit Request", "icon": "📝"},
    {"key": "approve_requests", "label": "Approve Requests", "icon": "✅"},
    {"key": "schedule_wos", "label": "Schedule WOs", "icon": "📅"},
    {"key": "view_all_projects", "label": "View All Projects", "icon": "👁️"},
    {"key": "configure_system", "label": "Configure System", "icon": "⚙️"},
    {"key": "log_downtime", "label": "Log Downtime", "icon": "⏱️"},
]

# Default roles
DEFAULT_ROLES = [
    {"name": "AM Admin", "description": "Full system access", "is_system_role": True},
    {"name": "Coordinator", "description": "Manage requests and schedules", "is_system_role": True},
    {"name": "Operator", "description": "Execute print jobs", "is_system_role": True},
    {"name": "QA", "description": "Quality inspection", "is_system_role": True},
    {"name": "Requestor", "description": "Submit print requests", "is_system_role": True},
    {"name": "Manager", "description": "View and approve", "is_system_role": True},
]

# In-memory storage for demo (replace with database in production)
tenant_roles: dict = {}
tenant_permissions: dict = {}
tenant_users: dict = {}

def get_roles_for_tenant(tenant_id: str):
    """Get all roles for a tenant"""
    if tenant_id not in tenant_roles:
        # Initialize with defaults
        tenant_roles[tenant_id] = []
        for role in DEFAULT_ROLES:
            tenant_roles[tenant_id].append({
                **role,
                "id": f"role_{role['name'].lower().replace(' ', '_')}",
                "tenant_id": tenant_id,
            })
        
        # Initialize permissions
        tenant_permissions[tenant_id] = {}
        for role in tenant_roles[tenant_id]:
            tenant_permissions[tenant_id][role["id"]] = DEFAULT_PERMISSIONS.get(role["name"], {})
    
    return tenant_roles[tenant_id]

def get_permissions_for_role(tenant_id: str, role_id: str):
    """Get permissions for a specific role"""
    if tenant_id not in tenant_permissions:
        get_roles_for_tenant(tenant_id)
    return tenant_permissions.get(tenant_id, {}).get(role_id, {})

def check_permission(tenant_id: str, role_id: str, permission_key: str) -> bool:
    """Check if a role has a specific permission"""
    perms = get_permissions_for_role(tenant_id, role_id)
    return perms.get(permission_key, False)

# Request/Response models
class PermissionMatrix(BaseModel):
    roles: List[dict]
    permissions: dict
    schema: List[dict]

class RolePermissionUpdate(BaseModel):
    role_id: str
    permissions: dict

class UserRoleAssignment(BaseModel):
    user_id: str
    user_email: str
    role_id: str

# API Endpoints
@router.get("/matrix")
async def get_permission_matrix(tenant: CurrentTenant):
    """Get full permission matrix for current tenant"""
    roles = get_roles_for_tenant(tenant.tenant_id)
    permissions = {}
    
    for role in roles:
        permissions[role["id"]] = get_permissions_for_role(tenant.tenant_id, role["id"])
    
    return {
        "roles": roles,
        "permissions": permissions,
        "schema": PERMISSIONS_SCHEMA,
    }

@router.put("/matrix/{role_id}")
async def update_role_permissions(
    role_id: str,
    update: RolePermissionUpdate,
    tenant: CurrentTenant,
):
    """Update permissions for a role (AM Admin only)"""
    if tenant.role != "AM Admin":
        raise HTTPException(status_code=403, detail="Only AM Admin can edit permissions")
    
    roles = get_roles_for_tenant(tenant.tenant_id)
    role = next((r for r in roles if r["id"] == role_id), None)
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Update permissions
    tenant_permissions[tenant.tenant_id][role_id] = update.permissions
    
    return {"message": "Permissions updated", "role": role, "permissions": update.permissions}

@router.get("/check/{permission_key}")
async def check_user_permission(
    permission_key: str,
    tenant: CurrentTenant,
):
    """Check if current user has a specific permission"""
    # In production: lookup user's role from user_roles table
    # For demo: assume user has the role from JWT
    user_role_id = f"role_{tenant.role.lower().replace(' ', '_')}"
    has_perm = check_permission(tenant.tenant_id, user_role_id, permission_key)
    
    return {
        "permission": permission_key,
        "allowed": has_perm,
        "role": tenant.role,
    }

@router.get("/my-permissions")
async def get_my_permissions(tenant: CurrentTenant):
    """Get all permissions for current user's role"""
    user_role_id = f"role_{tenant.role.lower().replace(' ', '_')}"
    perms = get_permissions_for_role(tenant.tenant_id, user_role_id)
    
    return {
        "role": tenant.role,
        "role_id": user_role_id,
        "permissions": perms,
    }

@router.get("/users")
async def get_tenant_users(tenant: CurrentTenant):
    """Get all users in current tenant with their roles"""
    # Mock data for demo
    users = [
        {"user_id": "user_001", "email": "admin@company.com", "role_id": "role_am_admin", "role_name": "AM Admin"},
        {"user_id": "user_002", "email": "coordinator@company.com", "role_id": "role_coordinator", "role_name": "Coordinator"},
        {"user_id": "user_003", "email": "operator@company.com", "role_id": "role_operator", "role_name": "Operator"},
        {"user_id": "user_004", "email": "qa@company.com", "role_id": "role_qa", "role_name": "QA"},
        {"user_id": "user_005", "email": "requestor@company.com", "role_id": "role_requestor", "role_name": "Requestor"},
        {"user_id": "user_006", "email": "manager@company.com", "role_id": "role_manager", "role_name": "Manager"},
    ]
    
    return {"users": users}

@router.put("/users/{user_id}/role")
async def assign_user_role(
    user_id: str,
    assignment: UserRoleAssignment,
    tenant: CurrentTenant,
):
    """Assign role to a user (AM Admin only)"""
    if tenant.role != "AM Admin":
        raise HTTPException(status_code=403, detail="Only AM Admin can assign roles")
    
    return {
        "message": f"Role assigned to user {user_id}",
        "user_id": user_id,
        "role_id": assignment.role_id,
    }
