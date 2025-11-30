-- Migration: Drop setup_status table
-- Description: Rollback setup_status table creation

DROP TRIGGER IF EXISTS update_setup_status_updated_at ON setup_status;
DROP TABLE IF EXISTS setup_status;

