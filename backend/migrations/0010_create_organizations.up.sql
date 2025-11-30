-- Migration: Create organizations table
-- Description: Organization/tenant management for multi-tenant support
-- Related Entity: src/domain/entities/organization.rs (Organization)
--
-- Tables Created:
--   - organizations
--
-- Indexes Created:
--   - idx_organizations_slug (B-tree, on slug - unique)
--   - idx_organizations_domain (B-tree, on domain)
--
-- Triggers Created:
--   - update_organizations_updated_at - Updates updated_at before row update

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    domain VARCHAR(255),
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

