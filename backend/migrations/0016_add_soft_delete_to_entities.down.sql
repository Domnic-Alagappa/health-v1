-- Rollback: Remove soft delete from entities

DROP INDEX IF EXISTS idx_organizations_deleted_at;
DROP INDEX IF EXISTS idx_permissions_deleted_at;
DROP INDEX IF EXISTS idx_roles_deleted_at;
DROP INDEX IF EXISTS idx_users_deleted_at;

ALTER TABLE permissions
DROP COLUMN IF EXISTS deleted_by,
DROP COLUMN IF EXISTS deleted_at;

ALTER TABLE roles
DROP COLUMN IF EXISTS deleted_by,
DROP COLUMN IF EXISTS deleted_at;

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organizations') THEN
        ALTER TABLE organizations
        DROP COLUMN IF EXISTS deleted_by,
        DROP COLUMN IF EXISTS deleted_at;
    END IF;
END $$;

ALTER TABLE users
DROP COLUMN IF EXISTS deleted_by,
DROP COLUMN IF EXISTS deleted_at;

