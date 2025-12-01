-- Rollback: Remove expiration and soft delete from relationships table

DROP INDEX IF EXISTS idx_relationships_metadata;
DROP INDEX IF EXISTS idx_relationships_valid;
DROP INDEX IF EXISTS idx_relationships_deleted_at;
DROP INDEX IF EXISTS idx_relationships_is_active;
DROP INDEX IF EXISTS idx_relationships_valid_from;
DROP INDEX IF EXISTS idx_relationships_expires_at;

ALTER TABLE relationships
DROP COLUMN IF EXISTS deleted_by,
DROP COLUMN IF EXISTS deleted_at,
DROP COLUMN IF EXISTS metadata,
DROP COLUMN IF EXISTS is_active,
DROP COLUMN IF EXISTS expires_at,
DROP COLUMN IF EXISTS valid_from;

