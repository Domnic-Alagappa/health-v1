-- Migration: Create groups table
-- Description: Groups are metadata entities, permissions managed via Zanzibar relationships
-- Related Entity: src/domain/entities/group.rs (Group)
--
-- Tables Created:
--   - groups
--
-- Indexes Created:
--   - idx_groups_name (B-tree, on name)
--   - idx_groups_organization_id (B-tree, on organization_id)
--   - idx_groups_deleted_at (B-tree, on deleted_at)
--   - idx_groups_name_org_unique (Unique, on name, organization_id WHERE deleted_at IS NULL)
--
-- Note: Groups don't have DEKs, permissions are managed via Zanzibar relationships only

CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES organizations(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    -- Audit fields
    request_id VARCHAR(255),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    system_id VARCHAR(255),
    version BIGINT DEFAULT 1 NOT NULL
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);
CREATE INDEX IF NOT EXISTS idx_groups_organization_id ON groups(organization_id);
CREATE INDEX IF NOT EXISTS idx_groups_deleted_at ON groups(deleted_at) WHERE deleted_at IS NULL;

-- Unique constraint: group name must be unique within organization (when not deleted)
CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_name_org_unique 
ON groups(name, organization_id) 
WHERE deleted_at IS NULL;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

