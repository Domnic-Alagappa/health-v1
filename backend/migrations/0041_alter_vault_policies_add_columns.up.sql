-- Add missing columns to vault_policies table
ALTER TABLE vault_policies
    ADD COLUMN IF NOT EXISTS policy_type VARCHAR(50) NOT NULL DEFAULT 'acl',
    ADD COLUMN IF NOT EXISTS raw_policy TEXT,
    ADD COLUMN IF NOT EXISTS parsed_policy JSONB;

-- Migrate existing data: copy policy to raw_policy
UPDATE vault_policies SET raw_policy = policy WHERE raw_policy IS NULL;

-- Make original policy column nullable (code now uses raw_policy)
ALTER TABLE vault_policies ALTER COLUMN policy DROP NOT NULL;

-- Create index on policy_type
CREATE INDEX IF NOT EXISTS idx_vault_policies_type ON vault_policies(policy_type);

