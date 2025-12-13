-- Drop vault policies table
DROP TRIGGER IF EXISTS vault_policies_updated_at ON vault_policies;
DROP FUNCTION IF EXISTS update_vault_policies_updated_at();
DROP INDEX IF EXISTS idx_vault_policies_name;
DROP TABLE IF EXISTS vault_policies;

