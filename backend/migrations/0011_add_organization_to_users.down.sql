-- Migration: Remove organization_id from users table
-- Description: Rollback organization_id column addition

DROP INDEX IF EXISTS idx_users_organization_id;
ALTER TABLE users DROP COLUMN IF EXISTS organization_id;

