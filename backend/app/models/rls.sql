-- ============================================
-- ROW LEVEL SECURITY (RLS) for Multi-Tenant Isolation
-- Ensures each company can ONLY see their own data
-- ============================================

-- Enable RLS on all operational tables
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for each table
-- Users can only see data from their own tenant (company)
CREATE POLICY tenant_isolation ON machines
    USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation ON work_orders
    USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation ON projects
    USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation ON print_requests
    USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation ON qc_records
    USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation ON material_inventory
    USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation ON spare_parts
    USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation ON ai_logs
    USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation ON notifications
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Users can only see members of their own tenant
CREATE POLICY tenant_isolation ON users
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- INSERT policies - new records automatically get the current tenant
CREATE POLICY tenant_insert ON machines
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_insert ON work_orders
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_insert ON projects
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_insert ON print_requests
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_insert ON qc_records
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_insert ON material_inventory
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_insert ON spare_parts
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_insert ON ai_logs
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_insert ON notifications
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));

-- UPDATE policies - can only update own tenant's data
CREATE POLICY tenant_update ON machines
    USING (tenant_id = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_update ON work_orders
    USING (tenant_id = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_update ON projects
    USING (tenant_id = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));

-- DELETE policies - can only delete own tenant's data
CREATE POLICY tenant_delete ON machines
    USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_delete ON work_orders
    USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_delete ON projects
    USING (tenant_id = current_setting('app.current_tenant_id', true));
