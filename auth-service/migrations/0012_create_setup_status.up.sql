-- Migration: Create setup_status table
-- Description: Track one-time initial setup completion
-- Related Entity: None (infrastructure table)
--
-- Tables Created:
--   - setup_status
--
-- Constraints:
--   - CHECK constraint ensures only one setup_completed = true record exists
--
-- Triggers Created:
--   - update_setup_status_updated_at - Updates updated_at before row update
--
-- Initial Data:
--   - Inserts initial record with setup_completed = false

CREATE TABLE IF NOT EXISTS setup_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setup_completed BOOLEAN NOT NULL DEFAULT false,
    setup_completed_at TIMESTAMPTZ,
    setup_completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT single_setup_status CHECK (
        (SELECT COUNT(*) FROM setup_status WHERE setup_completed = true) <= 1
    )
);

-- Insert initial setup status record (not completed)
INSERT INTO setup_status (setup_completed) VALUES (false)
ON CONFLICT DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_setup_status_updated_at BEFORE UPDATE ON setup_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

