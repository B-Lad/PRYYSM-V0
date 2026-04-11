-- 1. Create Tables
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table machines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  tech text not null, -- FDM, SLA, SLS
  status text default 'idle', -- idle, printing, error, maintenance
  job text,
  pct numeric default 0,
  remaining text,
  oee numeric default 0,
  created_at timestamptz default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  status text default 'active',
  owner text,
  due_date date,
  created_at timestamptz default now()
);

create table print_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  title text not null,
  stage text default 'submitted', -- submitted, review, planning, printing...
  tech text,
  qty numeric,
  created_at timestamptz default now()
);

-- 2. Enable Row Level Security (RLS)
alter table tenants enable row level security;
alter table machines enable row level security;
alter table projects enable row level security;
alter table print_requests enable row level security;

-- 3. Create Policies
-- Tenants: Users can only see their tenant
create policy "Isolate Tenants" on tenants for select
  using (auth.uid() IN (select user_id from tenant_members where tenant_id = id));

-- Machines: Filter by tenant_id
create policy "Isolate Machines" on machines
  for all using (auth.uid() IN (select user_id from tenant_members where tenant_id = tenant_id));

-- Projects: Filter by tenant_id
create policy "Isolate Projects" on projects
  for all using (auth.uid() IN (select user_id from tenant_members where tenant_id = tenant_id));

-- Requests: Filter by tenant_id
create policy "Isolate Requests" on print_requests
  for all using (auth.uid() IN (select user_id from tenant_members where tenant_id = tenant_id));

-- 4. Insert Sample Tenant
insert into tenants (id, name) values ('00000000-0000-0000-0000-000000000001', 'Pryysm Industries');

-- 5. Seed Data (Optional)
insert into machines (tenant_id, name, tech, status, job, pct) values
  ('00000000-0000-0000-0000-000000000001', 'Ender Pro 1', 'FDM', 'printing', 'WO-2041', 68);