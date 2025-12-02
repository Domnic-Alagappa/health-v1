-- Manual fix for request_id column if migrations didn't run
-- Run this directly in your PostgreSQL database if needed

-- Add request_id to users table if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS request_id VARCHAR(255);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_request_id ON users(request_id) WHERE request_id IS NOT NULL;

-- Verify it was added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'request_id';

