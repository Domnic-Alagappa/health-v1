-- Migration: Create modules table
-- Description: Modules represent features/functionality within apps (e.g., "users", "patients", "clinical")
-- Related Entity: src/domain/entities/module.rs (Module)
--
-- Tables Created:
--   - modules
--
-- Indexes Created:
--   - idx_modules_org_app_name (B-tree composite, on organization_id, app_name, name - unique)
--   - idx_modules_organization_id (B-tree, on organization_id)
--   - idx_modules_app_name (B-tree, on app_name)

CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL, -- e.g., "users", "patients", "clinical"
    app_name VARCHAR(255) NOT NULL, -- e.g., "admin-ui", "client-app"
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL for global modules
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    -- Audit fields
    request_id VARCHAR(255),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    system_id VARCHAR(255),
    version BIGINT DEFAULT 1 NOT NULL,
    -- Module names unique per organization/app combination
    UNIQUE(organization_id, app_name, name)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_modules_organization_id ON modules(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_modules_app_name ON modules(app_name);
CREATE INDEX IF NOT EXISTS idx_modules_org_app_name ON modules(organization_id, app_name, name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_modules_deleted_at ON modules(deleted_at) WHERE deleted_at IS NULL;

-- Add trigger to update updated_at automatically
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

