-- Migration: Remove request_id from tables
-- Description: Removes request_id column from refresh_tokens, audit_logs, passkey_credentials, and setup_status tables

-- Drop indexes first
DROP INDEX IF EXISTS idx_setup_status_request_id;
DROP INDEX IF EXISTS idx_passkey_credentials_request_id;
DROP INDEX IF EXISTS idx_audit_logs_request_id;
DROP INDEX IF EXISTS idx_refresh_tokens_request_id;

-- Drop columns
ALTER TABLE setup_status
DROP COLUMN IF EXISTS request_id;

ALTER TABLE passkey_credentials
DROP COLUMN IF EXISTS request_id;

ALTER TABLE audit_logs
DROP COLUMN IF EXISTS request_id;

ALTER TABLE refresh_tokens
DROP COLUMN IF EXISTS request_id;


