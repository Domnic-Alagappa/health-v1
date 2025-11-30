-- Remove audit fields from all tables

-- Remove triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
DROP TRIGGER IF EXISTS update_relationships_updated_at ON relationships;
DROP TRIGGER IF EXISTS update_encryption_keys_updated_at ON encryption_keys;

-- Remove function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Remove indexes
DROP INDEX IF EXISTS idx_users_request_id;
DROP INDEX IF EXISTS idx_users_created_by;
DROP INDEX IF EXISTS idx_users_updated_by;
DROP INDEX IF EXISTS idx_roles_request_id;
DROP INDEX IF EXISTS idx_permissions_request_id;
DROP INDEX IF EXISTS idx_relationships_request_id;

-- Remove audit columns from all tables
ALTER TABLE users 
DROP COLUMN IF EXISTS request_id,
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS updated_by,
DROP COLUMN IF EXISTS system_id,
DROP COLUMN IF EXISTS version;

ALTER TABLE roles
DROP COLUMN IF EXISTS request_id,
DROP COLUMN IF EXISTS created_at,
DROP COLUMN IF EXISTS updated_at,
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS updated_by,
DROP COLUMN IF EXISTS system_id,
DROP COLUMN IF EXISTS version;

ALTER TABLE permissions
DROP COLUMN IF EXISTS request_id,
DROP COLUMN IF EXISTS created_at,
DROP COLUMN IF EXISTS updated_at,
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS updated_by,
DROP COLUMN IF EXISTS system_id,
DROP COLUMN IF EXISTS version;

ALTER TABLE relationships
DROP COLUMN IF EXISTS request_id,
DROP COLUMN IF EXISTS updated_at,
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS updated_by,
DROP COLUMN IF EXISTS system_id,
DROP COLUMN IF EXISTS version;

ALTER TABLE encryption_keys
DROP COLUMN IF EXISTS request_id,
DROP COLUMN IF EXISTS updated_at,
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS updated_by,
DROP COLUMN IF EXISTS system_id,
DROP COLUMN IF EXISTS version;

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organizations') THEN
        ALTER TABLE organizations
        DROP COLUMN IF EXISTS request_id,
        DROP COLUMN IF EXISTS updated_at,
        DROP COLUMN IF EXISTS created_by,
        DROP COLUMN IF EXISTS updated_by,
        DROP COLUMN IF EXISTS system_id,
        DROP COLUMN IF EXISTS version;
    END IF;
END $$;

