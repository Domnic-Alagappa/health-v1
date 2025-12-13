-- Create vault_tokens table for token storage
CREATE TABLE IF NOT EXISTS vault_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    policies TEXT[] DEFAULT '{}',
    parent_id UUID REFERENCES vault_tokens(id) ON DELETE CASCADE,
    ttl BIGINT DEFAULT 3600,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    num_uses INTEGER DEFAULT 0,
    path VARCHAR(255),
    meta JSONB,
    renewable BOOLEAN DEFAULT true,
    entity_id UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vault_tokens_hash ON vault_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_vault_tokens_parent ON vault_tokens(parent_id);
CREATE INDEX IF NOT EXISTS idx_vault_tokens_expires ON vault_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_vault_tokens_entity ON vault_tokens(entity_id);

