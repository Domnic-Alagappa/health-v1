-- Migration: Drop policy templates table
-- Description: Remove policy templates table

DROP TRIGGER IF EXISTS update_policy_templates_updated_at ON policy_templates;
DROP TABLE IF EXISTS policy_templates;

