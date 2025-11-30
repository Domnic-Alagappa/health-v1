-- Migration: Drop organizations table
-- Description: Rollback organization table creation

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP INDEX IF EXISTS idx_organizations_domain;
DROP INDEX IF EXISTS idx_organizations_slug;
DROP TABLE IF EXISTS organizations;

