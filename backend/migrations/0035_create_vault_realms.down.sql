-- Drop vault realms table
DROP TRIGGER IF EXISTS vault_realms_updated_at ON vault_realms;
DROP FUNCTION IF EXISTS update_vault_realms_updated_at();
DROP INDEX IF EXISTS idx_vault_realms_name;
DROP TABLE IF EXISTS vault_realms;

