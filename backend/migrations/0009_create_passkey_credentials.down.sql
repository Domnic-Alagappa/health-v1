-- Rollback: Drop passkey_credentials table

DROP INDEX IF EXISTS idx_passkey_credentials_is_active;
DROP INDEX IF EXISTS idx_passkey_credentials_credential_id;
DROP INDEX IF EXISTS idx_passkey_credentials_user_id;
DROP TABLE IF EXISTS passkey_credentials;

