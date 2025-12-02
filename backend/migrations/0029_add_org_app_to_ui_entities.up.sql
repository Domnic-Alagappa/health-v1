-- Migration: Add organization_id and app_name to UI entity tables
-- Description: Scope UI entities (pages, buttons, fields, APIs) to organizations and apps
-- Related Entities: ui_pages, ui_buttons, ui_fields, ui_api_endpoints
--
-- Schema Changes:
--   - Adds organization_id and app_name to ui_pages, ui_buttons, ui_fields, ui_api_endpoints
--   - Updates unique constraints to include organization_id and app_name
--   - Adds indexes for organization/app-based queries

-- UI Pages table
ALTER TABLE ui_pages
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS app_name VARCHAR(255);

-- Update unique constraint for ui_pages
ALTER TABLE ui_pages
DROP CONSTRAINT IF EXISTS ui_pages_name_key;

ALTER TABLE ui_pages
ADD CONSTRAINT ui_pages_org_app_name_key 
UNIQUE(organization_id, app_name, name);

-- Create indexes for ui_pages
CREATE INDEX IF NOT EXISTS idx_ui_pages_organization_id ON ui_pages(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ui_pages_app_name ON ui_pages(app_name) WHERE app_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ui_pages_org_app ON ui_pages(organization_id, app_name) WHERE deleted_at IS NULL;

-- UI Buttons table
ALTER TABLE ui_buttons
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS app_name VARCHAR(255);

-- Update unique constraint for ui_buttons (button_id per page, but also per org/app)
ALTER TABLE ui_buttons
DROP CONSTRAINT IF EXISTS ui_buttons_page_id_button_id_key;

ALTER TABLE ui_buttons
ADD CONSTRAINT ui_buttons_page_org_app_button_key 
UNIQUE(page_id, organization_id, app_name, button_id);

-- Create indexes for ui_buttons
CREATE INDEX IF NOT EXISTS idx_ui_buttons_organization_id ON ui_buttons(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ui_buttons_app_name ON ui_buttons(app_name) WHERE app_name IS NOT NULL;

-- UI Fields table
ALTER TABLE ui_fields
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS app_name VARCHAR(255);

-- Update unique constraint for ui_fields
ALTER TABLE ui_fields
DROP CONSTRAINT IF EXISTS ui_fields_page_id_field_id_key;

ALTER TABLE ui_fields
ADD CONSTRAINT ui_fields_page_org_app_field_key 
UNIQUE(page_id, organization_id, app_name, field_id);

-- Create indexes for ui_fields
CREATE INDEX IF NOT EXISTS idx_ui_fields_organization_id ON ui_fields(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ui_fields_app_name ON ui_fields(app_name) WHERE app_name IS NOT NULL;

-- UI API Endpoints table
ALTER TABLE ui_api_endpoints
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS app_name VARCHAR(255);

-- Update unique constraint for ui_api_endpoints
ALTER TABLE ui_api_endpoints
DROP CONSTRAINT IF EXISTS ui_api_endpoints_endpoint_method_key;

ALTER TABLE ui_api_endpoints
ADD CONSTRAINT ui_api_endpoints_org_app_endpoint_method_key 
UNIQUE(organization_id, app_name, endpoint, method);

-- Create indexes for ui_api_endpoints
CREATE INDEX IF NOT EXISTS idx_ui_api_endpoints_organization_id ON ui_api_endpoints(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ui_api_endpoints_app_name ON ui_api_endpoints(app_name) WHERE app_name IS NOT NULL;

