# Pryysm MES v3.0 - Multi-Tenant Architecture

## 🔒 Data Isolation Strategy

### 1. Database Level - Row Level Security (RLS)
```sql
-- Every operational table has tenant_id column
-- PostgreSQL RLS ensures queries automatically filter by tenant
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON machines
    USING (tenant_id = current_setting('app.current_tenant_id', true));
```

**Protected Tables:**
- `machines` - Company equipment
- `work_orders` - Production jobs
- `projects` - Company projects
- `print_requests` - AM requests
- `qc_records` - Quality data
- `material_inventory` - Raw materials
- `spare_parts` - Consumables
- `ai_logs` - AI interaction history
- `notifications` - User notifications
- `users` - Company members

### 2. API Level - JWT Token Validation
```python
# Every API endpoint requires authentication
# JWT token contains: {sub, tenant_id, role, email}
# All queries filtered by tenant_id from token
```

**Enforcement Points:**
- Login → Validates tenant_id, embeds in JWT
- Every API call → Extracts tenant_id from JWT
- Database queries → WHERE tenant_id = current_user_tenant_id
- RLS → Double-enforces at database level

### 3. Application Level - Tenant Context
```python
# CurrentTenant dependency extracts tenant from JWT
@router.get("/machines")
async def get_machines(tenant: CurrentTenant, db: AsyncSession):
    # RLS ensures only tenant's machines are returned
    query = select(Machine).where(Machine.tenant_id == tenant.tenant_id)
```

## 🏢 Multi-Company Setup

### Tenant (Company) Structure
```
Company A (tenant_id: "comp_a1b2c3")
├── Users: admin@companyA.com, operator@companyA.com
├── Machines: M01-M07
├── Projects: PRJ-001 to PRJ-050
└── Data: Completely isolated from Company B

Company B (tenant_id: "comp_d4e5f6")
├── Users: admin@companyB.com, operator@companyB.com
├── Machines: M08-M15
├── Projects: PRJ-051 to PRJ-100
└── Data: Completely isolated from Company A
```

### Cross-Function Data Sharing
Within a tenant, all functions share data:
- **Projects** → link to → **Work Orders** → link to → **Machines**
- **Print Requests** → link to → **Projects** → link to → **Departments**
- **QC Records** → link to → **Work Orders** → link to → **Materials**
- **AI Assistant** → accesses → All tenant data (read-only)

**Between tenants:** NO data sharing possible (enforced by RLS + API)

## 🔐 Security Layers

| Layer | Protection | Mechanism |
|-------|-----------|-----------|
| **Authentication** | JWT Tokens | HS256 signed, expires in 30 min |
| **Authorization** | Role-based | admin, editor, viewer, operator, qa |
| **Row Level** | RLS Policies | PostgreSQL native enforcement |
| **API Level** | Tenant Filter | WHERE tenant_id = current_tenant |
| **Network** | Docker Isolation | Internal network, nginx proxy |

## 🚀 Deployment Commands
```bash
./deploy.sh              # Deploy all services
docker compose logs -f   # View logs
docker compose down      # Stop services
```

## 📊 Tenant Data Flow
```
User Login → JWT with tenant_id → API Request → 
  ├→ Extract tenant_id from JWT
  ├→ Set RLS context: current_setting('app.current_tenant_id')
  └→ Execute query (automatically filtered by RLS)
       └→ Return only current tenant's data
```
