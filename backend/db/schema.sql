-- ==============================================================================
-- PRYYSM MES v3.0 - COMPLETE PRODUCTION SCHEMA
-- ==============================================================================
-- Includes: Tenants, Users, Projects, WOs, Inventory, QC, NCR, Suppliers, Kaizen
-- Compatible: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Extensions
create extension if not exists "uuid-ossp";

-- 2. Enums & Types
create type tech_type as enum ('FDM', 'SLA', 'SLS');
create type project_priority as enum ('normal', 'high', 'urgent');
create type wo_status as enum ('planned', 'scheduled', 'printing', 'postproc', 'qa', 'completed', 'cancelled');
create type machine_status as enum ('idle', 'running', 'error', 'maintenance', 'offline');
create type inventory_status as enum ('ok', 'low', 'critical');
create type ncr_status as enum ('open', 'investigating', 'resolved', 'closed');
create type kaizen_status as enum ('proposed', 'in_progress', 'completed', 'rejected');

-- ==============================================================================
-- CORE: TENANTS & USERS
-- ==============================================================================

create table tenants (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text unique not null,
    settings jsonb default '{}', -- General config: currency, timezone, shifts
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- User Profiles (Links to Auth)
create table user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    tenant_id uuid references tenants(id),
    full_name text,
    role text default 'operator', -- admin, coordinator, operator, qa, manager, requestor
    department text,
    avatar_url text,
    is_active boolean default true,
    last_seen timestamptz default now(),
    created_at timestamptz default now()
);

-- ==============================================================================
-- ROLES & PERMISSIONS (From permissions.sql)
-- ==============================================================================

create table roles (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id),
    name text not null,
    description text,
    is_system boolean default false,
    created_at timestamptz default now()
);

create table permissions (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id),
    role_id uuid references roles(id) on delete cascade,
    permission_key text not null,
    allowed boolean default false,
    unique(tenant_id, role_id, permission_key)
);

-- ==============================================================================
-- PRODUCTION: PROJECTS & WORK ORDERS
-- ==============================================================================

create table projects (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id),
    custom_id text unique, -- e.g. PRJ-011
    name text not null,
    description text,
    dept text,
    owner_id uuid references user_profiles(id),
    priority project_priority default 'normal',
    status text default 'active', -- active, completed, on-hold
    budget numeric,
    spent numeric default 0,
    due_date date,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table work_orders (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id),
    custom_id text unique, -- e.g. WO-2041
    project_id uuid references projects(id) on delete cascade,
    part_name text not null,
    tech tech_type,
    material text,
    qty integer default 1,
    status wo_status default 'planned',
    machine_id text, -- references machines.custom_id
    operator_id uuid references user_profiles(id),
    due_date date,
    request_note text,
    extra_info jsonb, -- Stores AM Review data: post_proc_steps, qc_checks, instructions
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table print_requests (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id),
    custom_id text unique, -- e.g. REQ-088
    project_id uuid references projects(id),
    title text not null,
    requestor_id uuid references user_profiles(id),
    tech tech_type,
    material text,
    qty integer,
    priority project_priority default 'normal',
    status text default 'pending', -- pending, approved, rejected, completed
    notes text,
    image_url text,
    stage text default 'submitted', -- submitted, review, planning...
    groups_data jsonb, -- Material groups from frontend
    history_log jsonb, -- Full lifecycle history array
    created_at timestamptz default now()
);

-- Lifecycle Audit Log (Granular stage changes)
create table lifecycle_logs (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id),
    entity_type text not null, -- 'project' or 'wo'
    entity_id uuid not null,
    stage text not null,
    status text not null, -- 'done', 'in_progress', 'pending'
    note text,
    performed_by uuid references user_profiles(id),
    created_at timestamptz default now()
);

-- ==============================================================================
-- RESOURCES: MACHINES & INVENTORY
-- ==============================================================================

create table work_centers (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id),
    name text not null,
    location text,
    capacity integer,
    current_load integer default 0
);

create table machines (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id),
    custom_id text unique, -- e.g. M01
    name text not null,
    model text,
    tech tech_type,
    work_center_id uuid references work_centers(id),
    status machine_status default 'idle',
    current_job text,
    progress_pct numeric default 0,
    est_remaining text,
    oee numeric default 0,
    availability numeric default 0,
    performance numeric default 0,
    quality numeric default 0,
    last_maintenance date,
    created_at timestamptz default now()
);

-- Material Inventory (Filaments, Resins, Powders)
create table material_inventory (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id),
    custom_id text unique,
    name text not null,
    brand text,
    type text, -- PLA, ABS, PA12, etc.
    finish text, -- Matte, Glossy, etc.
    color text,
    color_hex text,
    unit text default 'spools', -- spools, L, kg
    quantity numeric default 0,
    min_quantity numeric default 5,
    status inventory_status generated always as (
        case 
            when quantity <= 0 then 'critical'
            when quantity < min_quantity then 'low'
            else 'ok'
        end
    ) stored,
    location text,
    created_at timestamptz default now()
);

-- Spare Parts Inventory
create table spare_parts_inventory (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id),
    custom_id text unique,
    name text not null,
    category text, -- electronics, tools, misc
    description text,
    quantity integer default 0,
    min_quantity integer default 2,
    location text,
    status inventory_status generated always as (
        case 
            when quantity <= 0 then 'critical'
            when quantity < min_quantity then 'low'
            else 'ok'
        end
    ) stored,
    created_at timestamptz default now()
);

-- ==============================================================================
-- QUALITY & IMPROVEMENT: NCR, QC, KAIZEN
-- ==============================================================================

-- QC Records (Linked to WOs)
create table qc_records (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id),
    wo_id uuid references work_orders(id),
    inspector_id uuid references user_profiles(id),
    result text, -- pass, fail, rework
    defects jsonb, -- Array of defect types
    notes text,
    inspected_at timestamptz default now()
);

-- NCR: Non-Conformance Reports (The "5 Whys" & Root Cause)
create table ncr_reports (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id),
    custom_id text unique, -- e.g. NCR-001
    related_wo_id uuid references work_orders(id),
    reported_by uuid references user_profiles(id),
    description text not null,
    root_cause_analysis jsonb, -- "5 Whys" data
    corrective_action text,
    status ncr_status default 'open',
    cost_impact numeric default 0,
    created_at timestamptz default now(),
    resolved_at timestamptz
);

-- Kaizen: Continuous Improvement
create table kaizen_entries (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id),
    custom_id text unique, -- e.g. KZ-001
    title text not null,
    description text,
    submitted_by uuid references user_profiles(id),
    category text, -- safety, quality, cost, delivery
    estimated_savings numeric,
    status kaizen_status default 'proposed',
    implementation_notes text,
    created_at timestamptz default now()
);

-- ==============================================================================
-- SUPPLY CHAIN: SUPPLIERS & PURCHASE ORDERS
-- ==============================================================================

create table suppliers (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id),
    name text not null,
    contact_name text,
    email text,
    phone text,
    lead_time_days integer, -- Avg lead time
    rating numeric, -- 1-5 stars
    status text default 'active',
    created_at timestamptz default now()
);

create table purchase_orders (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id),
    custom_id text unique, -- PO-001
    supplier_id uuid references suppliers(id),
    requested_by uuid references user_profiles(id),
    items jsonb, -- List of materials/spares + qty
    total_cost numeric,
    status text default 'draft', -- draft, ordered, received
    created_at timestamptz default now()
);

-- ==============================================================================
-- SYSTEM: AUDIT LOGS
-- ==============================================================================

create table audit_logs (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id),
    user_id uuid references user_profiles(id),
    action text not null,
    entity text,
    entity_id text,
    details jsonb,
    created_at timestamptz default now()
);

-- ==============================================================================
-- TRIGGERS & FUNCTIONS
-- ==============================================================================

-- 1. Auto-update timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_tenants_timestamp before update on tenants for each row execute function update_updated_at_column();
create trigger update_projects_timestamp before update on projects for each row execute function update_updated_at_column();
create trigger update_wos_timestamp before update on work_orders for each row execute function update_updated_at_column();

-- 2. Auto-generate Custom IDs
create or replace function generate_custom_id()
returns trigger as $$
declare
    prefix text;
    next_id integer;
begin
    -- Determine prefix based on table
    if TG_TABLE_NAME = 'projects' then prefix := 'PRJ-';
    elsif TG_TABLE_NAME = 'work_orders' then prefix := 'WO-';
    elsif TG_TABLE_NAME = 'print_requests' then prefix := 'REQ-';
    elsif TG_TABLE_NAME = 'ncr_reports' then prefix := 'NCR-';
    elsif TG_TABLE_NAME = 'kaizen_entries' then prefix := 'KZ-';
    elsif TG_TABLE_NAME = 'purchase_orders' then prefix := 'PO-';
    else return new;
    end if;

    if new.custom_id is null then
        select coalesce(max(cast(substring(custom_id from length(prefix) + 1) as integer)), 0) + 1 
        into next_id 
        from TG_TABLE 
        where custom_id ~ ('^' || prefix || '\d+$');
        
        new.custom_id := prefix || lpad(next_id::text, 4, '0');
    end if;
    return new;
end;
$$ language plpgsql;

create trigger trigger_project_id before insert on projects for each row execute function generate_custom_id();
create trigger trigger_wo_id before insert on work_orders for each row execute function generate_custom_id();
create trigger trigger_req_id before insert on print_requests for each row execute function generate_custom_id();

-- ==============================================================================
-- RLS POLICIES (Multi-tenancy)
-- ==============================================================================

-- Enable RLS on all tables
alter table tenants enable row level security;
alter table user_profiles enable row level security;
alter table projects enable row level security;
alter table work_orders enable row level security;
alter table print_requests enable row level security;
alter table machines enable row level security;
alter table material_inventory enable row level security;
alter table spare_parts_inventory enable row level security;
alter table ncr_reports enable row level security;
alter table kaizen_entries enable row level security;
alter table suppliers enable row level security;

-- Helper: Get user's tenant
create or replace function get_user_tenant() returns uuid as $$
    select tenant_id from user_profiles where id = auth.uid();
$$ language sql stable;

-- Policy: Users can only see data from their tenant
create policy tenant_isolation on projects for all using (tenant_id = get_user_tenant());
create policy tenant_isolation on work_orders for all using (tenant_id = get_user_tenant());
create policy tenant_isolation on print_requests for all using (tenant_id = get_user_tenant());
create policy tenant_isolation on machines for all using (tenant_id = get_user_tenant());
create policy tenant_isolation on material_inventory for all using (tenant_id = get_user_tenant());
create policy tenant_isolation on spare_parts_inventory for all using (tenant_id = get_user_tenant());
create policy tenant_isolation on ncr_reports for all using (tenant_id = get_user_tenant());

-- ==============================================================================
-- SEED DATA (Optional)
-- ==============================================================================
-- Insert one tenant
insert into tenants (id, name, slug) values ('00000000-0000-0000-0000-000000000001', 'Pryysm Industries', 'pryysm');
