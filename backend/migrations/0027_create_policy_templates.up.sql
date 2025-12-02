-- Migration: Create policy templates table
-- Description: Reusable permission policy templates that can be applied to users, groups, or roles
-- Related Entity: src/domain/entities/policy_template.rs (PolicyTemplate)
--
-- Tables Created:
--   - policy_templates
--
-- Indexes Created:
--   - idx_policy_templates_organization_id (B-tree, on organization_id)
--   - idx_policy_templates_org_name (B-tree composite, on organization_id, name - unique)
--   - idx_policy_templates_app_module (B-tree composite, on app_name, module_name)

CREATE TABLE IF NOT EXISTS policy_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL for global policies
    app_name VARCHAR(255), -- Optional: scoped to specific app
    module_name VARCHAR(255), -- Optional: scoped to specific module
    policy_definition JSONB NOT NULL, -- Array of relationship templates with placeholders
    -- Example:
    -- [
    --   {"relation": "can_access", "object": "organization:{org_id}/app:{app_name}"},
    --   {"relation": "view", "object": "organization:{org_id}/app:{app_name}/module:{module_name}/page:list"}
    -- ]
    applicable_to VARCHAR(50)[] DEFAULT ARRAY['user', 'group', 'role'], -- Which entity types can have this policy
    is_active BOOLEAN DEFAULT true NOT NULL,
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
    -- Policy names unique per organization
    UNIQUE(organization_id, name)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_policy_templates_organization_id ON policy_templates(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_policy_templates_org_name ON policy_templates(organization_id, name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_policy_templates_app_module ON policy_templates(app_name, module_name) WHERE app_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_policy_templates_is_active ON policy_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_policy_templates_deleted_at ON policy_templates(deleted_at) WHERE deleted_at IS NULL;

-- Add trigger to update updated_at automatically
CREATE TRIGGER update_policy_templates_updated_at BEFORE UPDATE ON policy_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

