-- Migration: Add app_type and app_device to sessions table
-- Description: Add app_type column to track which application (admin-ui, client-ui, api) and app_device to track device type (web, mobile, desktop, tablet)
-- Related Entity: src/domain/entities/session.rs (Session)

-- Columns Added:
--   - app_type VARCHAR(20) - Type of application: 'admin-ui', 'client-ui', or 'api'
--   - app_device VARCHAR(20) - Type of device: 'web', 'mobile', 'desktop', 'tablet'

-- Indexes Created:
--   - idx_sessions_app_type (B-tree, on app_type)
--   - idx_sessions_app_device (B-tree, on app_device)
--   - idx_sessions_user_id_app_type (B-tree, on user_id, app_type WHERE user_id IS NOT NULL)
--   - idx_sessions_user_id_app_device (B-tree, on user_id, app_device WHERE user_id IS NOT NULL)

-- Add app_type column to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS app_type VARCHAR(20);

-- Add app_device column to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS app_device VARCHAR(20);

-- Set default values for existing sessions (backward compatibility)
UPDATE sessions 
SET app_type = 'api', app_device = 'web'
WHERE app_type IS NULL OR app_device IS NULL;

-- Make columns NOT NULL after setting defaults
ALTER TABLE sessions 
ALTER COLUMN app_type SET NOT NULL;

ALTER TABLE sessions 
ALTER COLUMN app_device SET NOT NULL;

-- Add constraint to ensure app_type is one of the allowed values
ALTER TABLE sessions 
ADD CONSTRAINT check_app_type 
CHECK (app_type IN ('admin-ui', 'client-ui', 'api'));

-- Add constraint to ensure app_device is one of the allowed values
ALTER TABLE sessions 
ADD CONSTRAINT check_app_device 
CHECK (app_device IN ('web', 'mobile', 'desktop', 'tablet'));

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_sessions_app_type ON sessions(app_type);
CREATE INDEX IF NOT EXISTS idx_sessions_app_device ON sessions(app_device);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id_app_type ON sessions(user_id, app_type) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_user_id_app_device ON sessions(user_id, app_device) WHERE user_id IS NOT NULL;

