-- Migration: Add organization_id to users table
-- Description: Link users to organizations (nullable for super users)
-- Related Entity: src/domain/entities/user.rs (User)
--
-- Schema Changes:
--   - Adds organization_id column to users table (UUID, nullable)
--   - Adds foreign key: users.organization_id -> organizations.id (ON DELETE SET NULL)
--
-- Indexes Created:
--   - idx_users_organization_id (B-tree, on users.organization_id)

ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Create index for organization lookups
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- Update existing users to have NULL organization_id (they can be assigned later)
-- Super users remain organization-agnostic

