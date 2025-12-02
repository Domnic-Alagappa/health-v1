-- Migration: Ensure request_id column exists in users table
-- Description: Fixes "no column found for name: request_id" error
-- This migration ensures the request_id column exists even if migration 0013 didn't apply correctly

-- Add request_id to users table if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS request_id VARCHAR(255);

-- Create index if it doesn't exist (migration 0013 should have created it, but ensure it exists)
CREATE INDEX IF NOT EXISTS idx_users_request_id ON users(request_id) WHERE request_id IS NOT NULL;

