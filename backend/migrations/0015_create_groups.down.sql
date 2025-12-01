-- Rollback: Drop groups table

DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
DROP INDEX IF EXISTS idx_groups_name_org_unique;
DROP INDEX IF EXISTS idx_groups_deleted_at;
DROP INDEX IF EXISTS idx_groups_organization_id;
DROP INDEX IF EXISTS idx_groups_name;
DROP TABLE IF EXISTS groups;

