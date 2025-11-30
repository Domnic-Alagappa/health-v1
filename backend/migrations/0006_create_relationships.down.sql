-- Rollback: Drop relationships table

DROP INDEX IF EXISTS idx_relationships_composite;
DROP INDEX IF EXISTS idx_relationships_object_relation;
DROP INDEX IF EXISTS idx_relationships_user_relation;
DROP INDEX IF EXISTS idx_relationships_object;
DROP INDEX IF EXISTS idx_relationships_relation;
DROP INDEX IF EXISTS idx_relationships_user;
DROP TABLE IF EXISTS relationships;

