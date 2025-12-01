-- Rollback: Recreate encryption_keys table

CREATE TABLE IF NOT EXISTS encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL,
    entity_type VARCHAR(255) NOT NULL,
    encrypted_key BYTEA NOT NULL,
    nonce BYTEA NOT NULL,
    key_algorithm VARCHAR(50) NOT NULL DEFAULT 'AES-256-GCM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rotated_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(entity_id, entity_type, is_active) DEFERRABLE INITIALLY DEFERRED,
    -- Audit fields
    request_id VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    system_id VARCHAR(255),
    version BIGINT DEFAULT 1 NOT NULL
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_encryption_keys_entity_id ON encryption_keys(entity_id);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_entity_type ON encryption_keys(entity_type);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_entity_composite ON encryption_keys(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_is_active ON encryption_keys(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_encryption_keys_active_unique 
    ON encryption_keys(entity_id, entity_type) 
    WHERE is_active = true;

-- Recreate trigger
CREATE TRIGGER update_encryption_keys_updated_at BEFORE UPDATE ON encryption_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

