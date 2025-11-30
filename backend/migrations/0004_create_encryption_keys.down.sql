-- Rollback: Drop encryption_keys table

DROP INDEX IF EXISTS idx_encryption_keys_active_unique;
DROP INDEX IF EXISTS idx_encryption_keys_is_active;
DROP INDEX IF EXISTS idx_encryption_keys_entity_composite;
DROP INDEX IF EXISTS idx_encryption_keys_entity_type;
DROP INDEX IF EXISTS idx_encryption_keys_entity_id;
DROP TABLE IF EXISTS encryption_keys;

