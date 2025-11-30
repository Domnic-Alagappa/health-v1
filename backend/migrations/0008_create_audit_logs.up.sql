-- Migration: Create audit_logs table
-- Description: Store audit trail for key management and security operations
-- Related Entity: None (infrastructure table)
--
-- Tables Created:
--   - audit_logs
--
-- Indexes Created:
--   - idx_audit_logs_user_id (B-tree, on user_id)
--   - idx_audit_logs_action (B-tree, on action)
--   - idx_audit_logs_resource (B-tree, on resource)
--   - idx_audit_logs_resource_id (B-tree, on resource_id)
--   - idx_audit_logs_created_at (B-tree, on created_at)
--   - idx_audit_logs_resource_action (B-tree composite, on resource, action)

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    resource_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_action ON audit_logs(resource, action);

