-- Create vault metadata table for storing vault configuration and metadata
CREATE TABLE IF NOT EXISTS vault_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(512) NOT NULL UNIQUE,
    value BYTEA NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    request_id VARCHAR(255)
);

-- Create index on key for fast lookups
CREATE INDEX IF NOT EXISTS idx_vault_metadata_key ON vault_metadata(key);

-- Create index on request_id for audit
CREATE INDEX IF NOT EXISTS idx_vault_metadata_request_id ON vault_metadata(request_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_vault_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vault_metadata_updated_at
    BEFORE UPDATE ON vault_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_vault_metadata_updated_at();

