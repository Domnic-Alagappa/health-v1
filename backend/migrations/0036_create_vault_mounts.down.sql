-- Drop vault mounts table
DROP TRIGGER IF EXISTS vault_mounts_updated_at ON vault_mounts;
DROP FUNCTION IF EXISTS update_vault_mounts_updated_at();
DROP INDEX IF EXISTS idx_vault_mounts_path;
DROP TABLE IF EXISTS vault_mounts;

