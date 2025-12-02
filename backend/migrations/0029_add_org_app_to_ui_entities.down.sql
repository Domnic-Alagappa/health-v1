-- Migration: Remove organization_id and app_name from UI entity tables
-- Description: Revert organization and app scoping from UI entities

-- UI Pages
DROP INDEX IF EXISTS idx_ui_pages_org_app;
DROP INDEX IF EXISTS idx_ui_pages_app_name;
DROP INDEX IF EXISTS idx_ui_pages_organization_id;

ALTER TABLE ui_pages
DROP CONSTRAINT IF EXISTS ui_pages_org_app_name_key;

ALTER TABLE ui_pages
ADD CONSTRAINT ui_pages_name_key UNIQUE(name);

ALTER TABLE ui_pages
DROP COLUMN IF EXISTS app_name,
DROP COLUMN IF EXISTS organization_id;

-- UI Buttons
DROP INDEX IF EXISTS idx_ui_buttons_app_name;
DROP INDEX IF EXISTS idx_ui_buttons_organization_id;

ALTER TABLE ui_buttons
DROP CONSTRAINT IF EXISTS ui_buttons_page_org_app_button_key;

ALTER TABLE ui_buttons
ADD CONSTRAINT ui_buttons_page_id_button_id_key UNIQUE(page_id, button_id);

ALTER TABLE ui_buttons
DROP COLUMN IF EXISTS app_name,
DROP COLUMN IF EXISTS organization_id;

-- UI Fields
DROP INDEX IF EXISTS idx_ui_fields_app_name;
DROP INDEX IF EXISTS idx_ui_fields_organization_id;

ALTER TABLE ui_fields
DROP CONSTRAINT IF EXISTS ui_fields_page_org_app_field_key;

ALTER TABLE ui_fields
ADD CONSTRAINT ui_fields_page_id_field_id_key UNIQUE(page_id, field_id);

ALTER TABLE ui_fields
DROP COLUMN IF EXISTS app_name,
DROP COLUMN IF EXISTS organization_id;

-- UI API Endpoints
DROP INDEX IF EXISTS idx_ui_api_endpoints_app_name;
DROP INDEX IF EXISTS idx_ui_api_endpoints_organization_id;

ALTER TABLE ui_api_endpoints
DROP CONSTRAINT IF EXISTS ui_api_endpoints_org_app_endpoint_method_key;

ALTER TABLE ui_api_endpoints
ADD CONSTRAINT ui_api_endpoints_endpoint_method_key UNIQUE(endpoint, method);

ALTER TABLE ui_api_endpoints
DROP COLUMN IF EXISTS app_name,
DROP COLUMN IF EXISTS organization_id;

