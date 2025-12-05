-- Migration: Remove audit fields from organizations (rollback)
-- Note: This is a destructive operation

DROP INDEX IF EXISTS idx_organizations_request_id;

ALTER TABLE organizations
DROP COLUMN IF EXISTS request_id,
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS updated_by,
DROP COLUMN IF EXISTS system_id,
DROP COLUMN IF EXISTS version;

