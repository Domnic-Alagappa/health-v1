-- Drop vault metadata table
DROP TRIGGER IF EXISTS vault_metadata_updated_at ON vault_metadata;
DROP FUNCTION IF EXISTS update_vault_metadata_updated_at();
DROP INDEX IF EXISTS idx_vault_metadata_request_id;
DROP INDEX IF EXISTS idx_vault_metadata_key;
DROP TABLE IF EXISTS vault_metadata;

