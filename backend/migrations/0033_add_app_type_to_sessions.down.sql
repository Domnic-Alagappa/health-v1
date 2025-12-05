-- Migration: Remove app_type and app_device from sessions table
-- Description: Rollback the addition of app_type and app_device columns

-- Drop indexes
DROP INDEX IF EXISTS idx_sessions_user_id_app_device;
DROP INDEX IF EXISTS idx_sessions_user_id_app_type;
DROP INDEX IF EXISTS idx_sessions_app_device;
DROP INDEX IF EXISTS idx_sessions_app_type;

-- Drop constraints
ALTER TABLE sessions 
DROP CONSTRAINT IF EXISTS check_app_device;

ALTER TABLE sessions 
DROP CONSTRAINT IF EXISTS check_app_type;

-- Drop columns
ALTER TABLE sessions 
DROP COLUMN IF EXISTS app_device;

ALTER TABLE sessions 
DROP COLUMN IF EXISTS app_type;

