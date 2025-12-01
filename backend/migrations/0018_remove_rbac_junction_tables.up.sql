-- Migration: Remove RBAC junction tables
-- Description: Migrating to Zanzibar-only authorization
-- Related: User roles and role permissions are now stored in Zanzibar relationships table

-- Drop indexes first
DROP INDEX IF EXISTS idx_role_permissions_permission_id;
DROP INDEX IF EXISTS idx_role_permissions_role_id;
DROP INDEX IF EXISTS idx_user_roles_role_id;
DROP INDEX IF EXISTS idx_user_roles_user_id;

-- Drop tables
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS user_roles;

