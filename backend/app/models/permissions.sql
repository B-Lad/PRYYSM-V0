-- ============================================
-- ROLE-BASED PERMISSION SYSTEM
-- Each company can customize permissions for their roles
-- ============================================

-- Roles table (predefined per tenant)
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(50) NOT NULL, -- 'AM Admin', 'Coordinator', 'Operator', 'QA', 'Requestor', 'Manager'
    description TEXT,
    is_system_role BOOLEAN DEFAULT false, -- System roles can't be deleted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions matrix
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_key VARCHAR(100) NOT NULL, -- e.g., 'submit_request', 'approve_requests'
    allowed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_key)
);

-- User roles mapping
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by VARCHAR(36),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_isolation ON roles
    USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation ON permissions
    USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation ON user_roles
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Insert default roles for new tenants (triggered on tenant creation)
-- AM Admin: Full access
-- Coordinator: Submit, Approve, Schedule, View, Log
-- Operator: View, Log Downtime
-- QA: View, Log Downtime
-- Requestor: Submit, View
-- Manager: Submit, Approve, View
