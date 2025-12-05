-- Migration: Revert fix for update_updated_at_column trigger function
-- Description: Reverts the function to the previous version

-- Note: This down migration doesn't fully revert since we can't know
-- the exact previous state. The function will remain in its fixed state.

