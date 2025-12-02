-- Migration: Drop sessions table
-- Description: Remove sessions table and all related indexes

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
DROP INDEX IF EXISTS idx_sessions_expires_at;
DROP INDEX IF EXISTS idx_sessions_is_active;
DROP INDEX IF EXISTS idx_sessions_ip_address;
DROP INDEX IF EXISTS idx_sessions_last_activity;
DROP INDEX IF EXISTS idx_sessions_organization_id;
DROP INDEX IF EXISTS idx_sessions_user_id;
DROP INDEX IF EXISTS idx_sessions_session_token;
DROP TABLE IF EXISTS sessions;

