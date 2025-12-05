-- Migration: Revert update_updated_at_column trigger function
-- Description: Reverts to the previous version of the trigger function

-- Revert to the previous version
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

