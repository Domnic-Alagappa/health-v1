-- Migration: Remove request_id column from users table (if needed for rollback)
-- Note: This is a safety migration. In practice, you may not want to remove this column.

-- Drop index
DROP INDEX IF EXISTS idx_users_request_id;

-- Note: We don't drop the request_id column as it may be needed by other parts of the system
-- If you really need to remove it, uncomment the line below:
-- ALTER TABLE users DROP COLUMN IF EXISTS request_id;

