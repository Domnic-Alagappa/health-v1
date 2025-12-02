-- Migration: Drop modules table
-- Description: Remove modules table

DROP TRIGGER IF EXISTS update_modules_updated_at ON modules;
DROP TABLE IF EXISTS modules;

