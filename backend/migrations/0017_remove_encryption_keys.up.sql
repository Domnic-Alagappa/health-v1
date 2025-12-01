-- Migration: Remove encryption_keys table
-- Description: DEKs are now stored in Vault (OpenBao), not in database
-- Related: The KeyRepository is not used, DekManager uses Vault instead

-- Drop indexes first
DROP INDEX IF EXISTS idx_encryption_keys_active_unique;
DROP INDEX IF EXISTS idx_encryption_keys_is_active;
DROP INDEX IF EXISTS idx_encryption_keys_entity_composite;
DROP INDEX IF EXISTS idx_encryption_keys_entity_type;
DROP INDEX IF EXISTS idx_encryption_keys_entity_id;

-- Drop trigger
DROP TRIGGER IF EXISTS update_encryption_keys_updated_at ON encryption_keys;

-- Drop table
DROP TABLE IF EXISTS encryption_keys;

