-- Rollback: Drop roles and permissions tables

DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
DROP INDEX IF EXISTS idx_permissions_resource_action;
DROP INDEX IF EXISTS idx_permissions_name;
DROP INDEX IF EXISTS idx_roles_name;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;

