-- Migration: Create roles and permissions tables
-- Description: RBAC tables for role-based access control
-- Related Entities: 
--   - src/domain/entities/role.rs (Role)
--   - src/domain/entities/permission.rs (Permission)
--
-- Tables Created:
--   - roles
--   - permissions
--
-- Indexes Created:
--   - idx_roles_name (B-tree, on roles.name)
--   - idx_permissions_name (B-tree, on permissions.name)
--   - idx_permissions_resource_action (B-tree composite, on permissions.resource, permissions.action)
--
-- Triggers Created:
--   - update_roles_updated_at - Updates updated_at before row update

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    resource VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(resource, action)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);

-- Add trigger to update roles updated_at timestamp
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

