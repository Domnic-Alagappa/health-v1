-- Migration: Fix update_updated_at_column trigger function - version field issue
-- Description: Fixes the "record "new" has no field "version"" error
-- Related Entities: All entities with version fields
--
-- Issue: The trigger function may have been created before the version column
-- was properly added, causing a schema mismatch error.
--
-- Fix: Ensure version column exists, then recreate the function properly

-- First, ensure the version column exists on all tables that should have it
DO $$ 
BEGIN
    -- Users table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'version'
    ) THEN
        ALTER TABLE users ADD COLUMN version BIGINT DEFAULT 1 NOT NULL;
    END IF;
    
    -- Roles table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'roles' AND column_name = 'version'
        ) THEN
            ALTER TABLE roles ADD COLUMN version BIGINT DEFAULT 1 NOT NULL;
        END IF;
    END IF;
    
    -- Permissions table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'permissions' AND column_name = 'version'
        ) THEN
            ALTER TABLE permissions ADD COLUMN version BIGINT DEFAULT 1 NOT NULL;
        END IF;
    END IF;
    
    -- Setup_status table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'setup_status') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'setup_status' AND column_name = 'version'
        ) THEN
            ALTER TABLE setup_status ADD COLUMN version BIGINT DEFAULT 1 NOT NULL;
        END IF;
    END IF;
    
    -- Relationships table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'relationships') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'relationships' AND column_name = 'version'
        ) THEN
            ALTER TABLE relationships ADD COLUMN version BIGINT DEFAULT 1 NOT NULL;
        END IF;
    END IF;
    
    -- Organizations table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'organizations' AND column_name = 'version'
        ) THEN
            ALTER TABLE organizations ADD COLUMN version BIGINT DEFAULT 1 NOT NULL;
        END IF;
    END IF;
    
    -- Groups table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'groups') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'groups' AND column_name = 'version'
        ) THEN
            ALTER TABLE groups ADD COLUMN version BIGINT DEFAULT 1 NOT NULL;
        END IF;
    END IF;
    
    -- UI entities tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ui_pages') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ui_pages' AND column_name = 'version'
        ) THEN
            ALTER TABLE ui_pages ADD COLUMN version BIGINT DEFAULT 1 NOT NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ui_buttons') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ui_buttons' AND column_name = 'version'
        ) THEN
            ALTER TABLE ui_buttons ADD COLUMN version BIGINT DEFAULT 1 NOT NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ui_fields') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ui_fields' AND column_name = 'version'
        ) THEN
            ALTER TABLE ui_fields ADD COLUMN version BIGINT DEFAULT 1 NOT NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ui_api_endpoints') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ui_api_endpoints' AND column_name = 'version'
        ) THEN
            ALTER TABLE ui_api_endpoints ADD COLUMN version BIGINT DEFAULT 1 NOT NULL;
        END IF;
    END IF;
END $$;

-- Drop all triggers that depend on this function
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
DROP TRIGGER IF EXISTS update_relationships_updated_at ON relationships;
DROP TRIGGER IF EXISTS update_encryption_keys_updated_at ON encryption_keys;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_setup_status_updated_at ON setup_status;
DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
DROP TRIGGER IF EXISTS update_ui_pages_updated_at ON ui_pages;
DROP TRIGGER IF EXISTS update_ui_buttons_updated_at ON ui_buttons;
DROP TRIGGER IF EXISTS update_ui_fields_updated_at ON ui_fields;
DROP TRIGGER IF EXISTS update_ui_api_endpoints_updated_at ON ui_api_endpoints;

-- Drop the function completely to clear any cached definitions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Recreate the function with proper version handling
-- This function is only called by BEFORE UPDATE triggers
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    -- Increment version for UPDATE operations
    -- OLD always exists in BEFORE UPDATE triggers
    -- Use COALESCE to handle any NULL values safely
    NEW.version := COALESCE(OLD.version, 0) + 1;
    RETURN NEW;
END;
$$;

-- Recreate all triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Only recreate encryption_keys trigger if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'encryption_keys') THEN
        CREATE TRIGGER update_encryption_keys_updated_at BEFORE UPDATE ON encryption_keys
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Only recreate organizations trigger if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organizations') THEN
        CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TRIGGER update_setup_status_updated_at BEFORE UPDATE ON setup_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Only recreate groups trigger if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'groups') THEN
        CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Only recreate UI entity triggers if tables exist
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ui_pages') THEN
        CREATE TRIGGER update_ui_pages_updated_at BEFORE UPDATE ON ui_pages
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ui_buttons') THEN
        CREATE TRIGGER update_ui_buttons_updated_at BEFORE UPDATE ON ui_buttons
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ui_fields') THEN
        CREATE TRIGGER update_ui_fields_updated_at BEFORE UPDATE ON ui_fields
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ui_api_endpoints') THEN
        CREATE TRIGGER update_ui_api_endpoints_updated_at BEFORE UPDATE ON ui_api_endpoints
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

