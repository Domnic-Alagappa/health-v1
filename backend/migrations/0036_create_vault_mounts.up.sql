-- Create vault mounts table
CREATE TABLE IF NOT EXISTS vault_mounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path VARCHAR(255) NOT NULL UNIQUE,
    mount_type VARCHAR(100) NOT NULL,
    description TEXT,
    config JSONB,
    options JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    request_id VARCHAR(255)
);

-- Create index on path
CREATE INDEX IF NOT EXISTS idx_vault_mounts_path ON vault_mounts(path);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_vault_mounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vault_mounts_updated_at
    BEFORE UPDATE ON vault_mounts
    FOR EACH ROW
    EXECUTE FUNCTION update_vault_mounts_updated_at();

