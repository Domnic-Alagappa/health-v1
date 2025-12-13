-- Create vault policies table
CREATE TABLE IF NOT EXISTS vault_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    policy TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    request_id VARCHAR(255)
);

-- Create index on name
CREATE INDEX IF NOT EXISTS idx_vault_policies_name ON vault_policies(name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_vault_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vault_policies_updated_at
    BEFORE UPDATE ON vault_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_vault_policies_updated_at();

