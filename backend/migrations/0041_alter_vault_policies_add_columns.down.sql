-- Remove added columns from vault_policies table
DROP INDEX IF EXISTS idx_vault_policies_type;
ALTER TABLE vault_policies
    DROP COLUMN IF EXISTS policy_type,
    DROP COLUMN IF EXISTS raw_policy,
    DROP COLUMN IF EXISTS parsed_policy;

