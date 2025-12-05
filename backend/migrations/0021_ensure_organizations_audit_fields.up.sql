-- Migration: Ensure organizations table has all audit fields
-- Description: Explicitly add audit fields to organizations table if they don't exist
-- This fixes the "no column found for name: request_id" error

-- Add audit fields to organizations table (if not already present)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS request_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS system_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 1 NOT NULL;

-- Ensure updated_at exists (should already exist, but just in case)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Update existing rows to have version = 1 if NULL
UPDATE organizations SET version = 1 WHERE version IS NULL;

-- Create index for request_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_organizations_request_id ON organizations(request_id);

