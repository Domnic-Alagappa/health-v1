-- Migration: Create encryption_keys table
-- Description: Store Data Encryption Keys (DEKs) encrypted with master key
-- Related Entity: src/domain/entities/encryption_key.rs (EncryptionKey)
--
-- Tables Created:
--   - encryption_keys
--
-- Indexes Created:
--   - idx_encryption_keys_entity_id (B-tree, on entity_id)
--   - idx_encryption_keys_entity_type (B-tree, on entity_type)
--   - idx_encryption_keys_entity_composite (B-tree composite, on entity_id, entity_type)
--   - idx_encryption_keys_is_active (B-tree, on is_active)
--   - idx_encryption_keys_active_unique (Unique Partial, on entity_id, entity_type WHERE is_active = true)

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
    UNIQUE(entity_id, entity_type, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_encryption_keys_entity_id ON encryption_keys(entity_id);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_entity_type ON encryption_keys(entity_type);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_entity_composite ON encryption_keys(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_is_active ON encryption_keys(is_active);

-- Partial index for active keys only
CREATE UNIQUE INDEX IF NOT EXISTS idx_encryption_keys_active_unique 
    ON encryption_keys(entity_id, entity_type) 
    WHERE is_active = true;

