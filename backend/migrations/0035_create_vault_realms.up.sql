-- Create vault realms table
CREATE TABLE IF NOT EXISTS vault_realms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    request_id VARCHAR(255)
);

-- Create index on name
CREATE INDEX IF NOT EXISTS idx_vault_realms_name ON vault_realms(name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_vault_realms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vault_realms_updated_at
    BEFORE UPDATE ON vault_realms
    FOR EACH ROW
    EXECUTE FUNCTION update_vault_realms_updated_at();

