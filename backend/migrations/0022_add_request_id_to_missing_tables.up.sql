-- Migration: Add request_id to tables that were created before audit fields migration
-- Description: Adds request_id column to refresh_tokens, audit_logs, passkey_credentials, and setup_status tables
-- This fixes the "no column found for name: request_id" error

-- Add request_id to refresh_tokens table
ALTER TABLE refresh_tokens
ADD COLUMN IF NOT EXISTS request_id VARCHAR(255);

-- Add request_id to audit_logs table
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS request_id VARCHAR(255);

-- Add request_id to passkey_credentials table
ALTER TABLE passkey_credentials
ADD COLUMN IF NOT EXISTS request_id VARCHAR(255);

-- Add request_id to setup_status table
ALTER TABLE setup_status
ADD COLUMN IF NOT EXISTS request_id VARCHAR(255);

-- Create indexes for request_id (optional, for query performance)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_request_id ON refresh_tokens(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_passkey_credentials_request_id ON passkey_credentials(request_id);
CREATE INDEX IF NOT EXISTS idx_setup_status_request_id ON setup_status(request_id);

