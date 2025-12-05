-- Migration: Create sessions table
-- Description: Track session lifecycle including ghost sessions (pre-authentication) and authenticated sessions
-- Related Entity: src/domain/entities/session.rs (Session)

-- Tables Created:
--   - sessions

-- Indexes Created:
--   - idx_sessions_session_token (B-tree, on session_token)
--   - idx_sessions_user_id (B-tree, on user_id WHERE user_id IS NOT NULL)
--   - idx_sessions_organization_id (B-tree, on organization_id WHERE organization_id IS NOT NULL)
--   - idx_sessions_last_activity (B-tree, on last_activity_at WHERE is_active = true)
--   - idx_sessions_ip_address (B-tree, on ip_address)

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    authenticated_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Audit fields
    request_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    system_id VARCHAR(255),
    version BIGINT DEFAULT 1 NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_organization_id ON sessions(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_ip_address ON sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at) WHERE is_active = true;

-- Add trigger to update updated_at timestamp (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_sessions_updated_at' 
        AND tgrelid = 'sessions'::regclass
    ) THEN
        CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

