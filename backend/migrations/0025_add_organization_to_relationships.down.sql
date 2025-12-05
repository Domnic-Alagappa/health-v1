-- Migration: Remove organization_id from relationships table
-- Description: Revert organization scoping from relationships

-- Drop indexes
DROP INDEX IF EXISTS idx_relationships_org_object_relation;
DROP INDEX IF EXISTS idx_relationships_org_user_relation;
DROP INDEX IF EXISTS idx_relationships_organization_id;

-- Drop new unique constraint
ALTER TABLE relationships
DROP CONSTRAINT IF EXISTS relationships_user_relation_object_org_key;

-- Restore old unique constraint
ALTER TABLE relationships
ADD CONSTRAINT relationships_user_relation_object_key 
UNIQUE("user", relation, object);

-- Remove organization_id column
ALTER TABLE relationships
DROP COLUMN IF EXISTS organization_id;

