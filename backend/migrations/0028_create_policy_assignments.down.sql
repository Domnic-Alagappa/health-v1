-- Migration: Drop policy assignments table
-- Description: Remove policy assignments table

DROP TRIGGER IF EXISTS update_policy_assignments_updated_at ON policy_assignments;
DROP TABLE IF EXISTS policy_assignments;

