-- Migration: Add expiration and soft delete to relationships table
-- Description: Adds time-bound permissions and soft delete support to Zanzibar relationships
-- Related Entity: src/domain/entities/relationship.rs (Relationship)
--
-- Schema Changes:
--   - Adds: expires_at, valid_from, is_active, metadata (JSONB), deleted_at, deleted_by
--   - Updates queries to filter expired and deleted relationships
--
-- Indexes Created:
--   - idx_relationships_expires_at (B-tree, on expires_at)
--   - idx_relationships_valid_from (B-tree, on valid_from)
--   - idx_relationships_is_active (B-tree, on is_active)
--   - idx_relationships_deleted_at (B-tree, on deleted_at)
--   - idx_relationships_valid (Partial, on user, relation, object WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW()) AND deleted_at IS NULL)

ALTER TABLE relationships
ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

-- Create indexes for expiration queries
CREATE INDEX IF NOT EXISTS idx_relationships_expires_at 
ON relationships(expires_at) 
WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_relationships_valid_from 
ON relationships(valid_from) 
WHERE valid_from IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_relationships_is_active 
ON relationships(is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_relationships_deleted_at 
ON relationships(deleted_at) 
WHERE deleted_at IS NULL;

-- Partial index for valid, non-deleted relationships (most common query)
CREATE INDEX IF NOT EXISTS idx_relationships_valid 
ON relationships("user", relation, object) 
WHERE is_active = true 
AND (expires_at IS NULL OR expires_at > NOW())
AND (valid_from IS NULL OR valid_from <= NOW())
AND deleted_at IS NULL;

-- Create index for metadata queries (if needed for searching)
CREATE INDEX IF NOT EXISTS idx_relationships_metadata 
ON relationships USING GIN (metadata) 
WHERE metadata IS NOT NULL AND metadata != '{}'::jsonb;

