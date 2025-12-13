-- Drop vault auth methods table
DROP TRIGGER IF EXISTS vault_auth_methods_updated_at ON vault_auth_methods;
DROP FUNCTION IF EXISTS update_vault_auth_methods_updated_at();
DROP INDEX IF EXISTS idx_vault_auth_methods_path;
DROP TABLE IF EXISTS vault_auth_methods;

