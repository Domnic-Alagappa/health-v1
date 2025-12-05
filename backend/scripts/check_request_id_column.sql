-- Quick check script to verify request_id column exists in users table
-- Run this in your database to check if the column exists

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'request_id';

-- If the query returns no rows, the column doesn't exist and you need to run migrations
-- If it returns a row, the column exists and the issue might be elsewhere

