-- Migration: Create policy assignments table
-- Description: Tracks which policy templates are applied to which users, groups, or roles
-- Related Entity: src/domain/entities/policy_assignment.rs (PolicyAssignment)
--
-- Tables Created:
--   - policy_assignments
--
-- Indexes Created:
--   - idx_policy_assignments_policy_id (B-tree, on policy_template_id)
--   - idx_policy_assignments_target (B-tree composite, on target_type, target_id)
--   - idx_policy_assignments_organization_id (B-tree, on organization_id)
--   - idx_policy_assignments_unique (B-tree composite, on policy_template_id, target_type, target_id, organization_id - unique)

CREATE TABLE IF NOT EXISTS policy_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_template_id UUID REFERENCES policy_templates(id) ON DELETE CASCADE NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'user', 'group', 'role'
    target_id UUID NOT NULL, -- user_id, group_id, or role_id (no FK to allow flexibility)
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL, -- Context for org-scoped policies
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_by UUID REFERENCES users(id),
    expires_at TIMESTAMPTZ, -- Optional: when this policy assignment expires
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
    -- Unique constraint: same policy can't be applied twice to same target in same org
    UNIQUE(policy_template_id, target_type, target_id, organization_id)
);

-- Add trigger to update updated_at automatically
CREATE TRIGGER update_policy_assignments_updated_at BEFORE UPDATE ON policy_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_policy_assignments_policy_id ON policy_assignments(policy_template_id);
CREATE INDEX IF NOT EXISTS idx_policy_assignments_target ON policy_assignments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_policy_assignments_organization_id ON policy_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_policy_assignments_deleted_at ON policy_assignments(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_policy_assignments_expires_at ON policy_assignments(expires_at) WHERE expires_at IS NOT NULL;

