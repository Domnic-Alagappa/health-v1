-- Migration: Add organization_id to relationships table
-- Description: Add organization scoping to Zanzibar relationships for multi-tenant support
-- Related Entity: src/domain/entities/relationship.rs (Relationship)
--
-- Schema Changes:
--   - Adds organization_id column to relationships table (nullable for backward compatibility)
--   - Updates unique constraint to include organization_id
--   - Adds index for organization-based queries
--
-- Indexes Created:
--   - idx_relationships_organization_id (B-tree, on organization_id)

-- Add organization_id column (nullable for backward compatibility with existing relationships)
ALTER TABLE relationships
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for organization-based queries
CREATE INDEX IF NOT EXISTS idx_relationships_organization_id 
ON relationships(organization_id) 
WHERE organization_id IS NOT NULL;

-- Drop old unique constraint
ALTER TABLE relationships
DROP CONSTRAINT IF EXISTS relationships_user_relation_object_key;

-- Create new unique constraint that includes organization_id
-- This allows same relationship in different organizations
ALTER TABLE relationships
ADD CONSTRAINT relationships_user_relation_object_org_key 
UNIQUE("user", relation, object, organization_id);

-- Create composite index for organization-scoped queries
CREATE INDEX IF NOT EXISTS idx_relationships_org_user_relation 
ON relationships(organization_id, "user", relation) 
WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_relationships_org_object_relation 
ON relationships(organization_id, object, relation) 
WHERE organization_id IS NOT NULL;

