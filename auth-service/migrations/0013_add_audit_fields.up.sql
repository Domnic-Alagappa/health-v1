-- Add audit fields to all tables

-- Users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS request_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS system_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 1 NOT NULL;

-- Roles table
ALTER TABLE roles
ADD COLUMN IF NOT EXISTS request_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS system_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 1 NOT NULL;

-- Permissions table
ALTER TABLE permissions
ADD COLUMN IF NOT EXISTS request_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS system_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 1 NOT NULL;

-- Relationships table
ALTER TABLE relationships
ADD COLUMN IF NOT EXISTS request_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS system_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 1 NOT NULL;

-- Encryption keys table
ALTER TABLE encryption_keys
ADD COLUMN IF NOT EXISTS request_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS system_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 1 NOT NULL;

-- Organizations table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organizations') THEN
        ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS request_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
        ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id),
        ADD COLUMN IF NOT EXISTS system_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 1 NOT NULL;
    END IF;
END $$;

-- Create indexes for audit fields
CREATE INDEX IF NOT EXISTS idx_users_request_id ON users(request_id);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
CREATE INDEX IF NOT EXISTS idx_users_updated_by ON users(updated_by);
CREATE INDEX IF NOT EXISTS idx_roles_request_id ON roles(request_id);
CREATE INDEX IF NOT EXISTS idx_permissions_request_id ON permissions(request_id);
CREATE INDEX IF NOT EXISTS idx_relationships_request_id ON relationships(request_id);

-- Create trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to all tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_relationships_updated_at ON relationships;
CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_encryption_keys_updated_at ON encryption_keys;
CREATE TRIGGER update_encryption_keys_updated_at BEFORE UPDATE ON encryption_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

