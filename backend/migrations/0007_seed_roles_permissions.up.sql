-- Migration: Seed initial roles, permissions, and super user
-- Description: Create default roles and permissions, and initial super user
-- Related Entities: 
--   - src/domain/entities/role.rs (Role)
--   - src/domain/entities/permission.rs (Permission)
--   - src/domain/entities/user.rs (User)
--
-- Data Seeded:
--   - Default roles: admin, doctor, nurse, receptionist
--   - Permissions for: patients, users, clinical, orders, results, pharmacy, scheduling, revenue, analytics, settings
--   - Role-permission assignments for doctor, nurse, receptionist
--   - Initial super user: admin@example.com (password placeholder)

-- Insert default roles
INSERT INTO roles (id, name, description) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin', 'Administrator with full access'),
    ('00000000-0000-0000-0000-000000000002', 'doctor', 'Medical doctor role'),
    ('00000000-0000-0000-0000-000000000003', 'nurse', 'Nursing staff role'),
    ('00000000-0000-0000-0000-000000000004', 'receptionist', 'Front desk receptionist role')
ON CONFLICT (name) DO NOTHING;

-- Insert permissions (matching frontend permissions)
INSERT INTO permissions (id, name, resource, action, description) VALUES
    -- Patient permissions
    (gen_random_uuid(), 'patients:view', 'patients', 'view', 'View patient information'),
    (gen_random_uuid(), 'patients:create', 'patients', 'create', 'Create new patients'),
    (gen_random_uuid(), 'patients:update', 'patients', 'update', 'Update patient information'),
    (gen_random_uuid(), 'patients:delete', 'patients', 'delete', 'Delete patients'),
    (gen_random_uuid(), 'patients:view:ssn', 'patients', 'view:ssn', 'View patient SSN'),
    (gen_random_uuid(), 'patients:view:full', 'patients', 'view:full', 'View full patient details'),
    
    -- User permissions
    (gen_random_uuid(), 'users:view', 'users', 'view', 'View user information'),
    (gen_random_uuid(), 'users:create', 'users', 'create', 'Create new users'),
    (gen_random_uuid(), 'users:update', 'users', 'update', 'Update user information'),
    (gen_random_uuid(), 'users:delete', 'users', 'delete', 'Delete users'),
    
    -- Clinical permissions
    (gen_random_uuid(), 'clinical:view', 'clinical', 'view', 'View clinical notes'),
    (gen_random_uuid(), 'clinical:create', 'clinical', 'create', 'Create clinical notes'),
    (gen_random_uuid(), 'clinical:update', 'clinical', 'update', 'Update clinical notes'),
    (gen_random_uuid(), 'clinical:delete', 'clinical', 'delete', 'Delete clinical notes'),
    
    -- Orders permissions
    (gen_random_uuid(), 'orders:view', 'orders', 'view', 'View orders'),
    (gen_random_uuid(), 'orders:create', 'orders', 'create', 'Create orders'),
    (gen_random_uuid(), 'orders:update', 'orders', 'update', 'Update orders'),
    (gen_random_uuid(), 'orders:delete', 'orders', 'delete', 'Delete orders'),
    
    -- Results permissions
    (gen_random_uuid(), 'results:view', 'results', 'view', 'View test results'),
    (gen_random_uuid(), 'results:create', 'results', 'create', 'Create test results'),
    (gen_random_uuid(), 'results:update', 'results', 'update', 'Update test results'),
    (gen_random_uuid(), 'results:delete', 'results', 'delete', 'Delete test results'),
    
    -- Pharmacy permissions
    (gen_random_uuid(), 'pharmacy:view', 'pharmacy', 'view', 'View pharmacy information'),
    (gen_random_uuid(), 'pharmacy:create', 'pharmacy', 'create', 'Create pharmacy entries'),
    (gen_random_uuid(), 'pharmacy:update', 'pharmacy', 'update', 'Update pharmacy entries'),
    (gen_random_uuid(), 'pharmacy:delete', 'pharmacy', 'delete', 'Delete pharmacy entries'),
    
    -- Scheduling permissions
    (gen_random_uuid(), 'scheduling:view', 'scheduling', 'view', 'View schedules'),
    (gen_random_uuid(), 'scheduling:create', 'scheduling', 'create', 'Create appointments'),
    (gen_random_uuid(), 'scheduling:update', 'scheduling', 'update', 'Update appointments'),
    (gen_random_uuid(), 'scheduling:delete', 'scheduling', 'delete', 'Delete appointments'),
    
    -- Revenue permissions
    (gen_random_uuid(), 'revenue:view', 'revenue', 'view', 'View revenue information'),
    (gen_random_uuid(), 'revenue:create', 'revenue', 'create', 'Create revenue entries'),
    (gen_random_uuid(), 'revenue:update', 'revenue', 'update', 'Update revenue entries'),
    (gen_random_uuid(), 'revenue:delete', 'revenue', 'delete', 'Delete revenue entries'),
    
    -- Analytics permissions
    (gen_random_uuid(), 'analytics:view', 'analytics', 'view', 'View analytics'),
    (gen_random_uuid(), 'analytics:export', 'analytics', 'export', 'Export analytics data'),
    
    -- Settings permissions
    (gen_random_uuid(), 'settings:view', 'settings', 'view', 'View settings'),
    (gen_random_uuid(), 'settings:update', 'settings', 'update', 'Update settings')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- Admin gets all permissions (we'll assign all permissions programmatically)
-- Doctor permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    '00000000-0000-0000-0000-000000000002'::UUID, -- doctor role
    id
FROM permissions
WHERE name IN (
    'patients:view', 'patients:view:full',
    'clinical:view', 'clinical:create', 'clinical:update',
    'orders:view', 'orders:create',
    'results:view',
    'scheduling:view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Nurse permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    '00000000-0000-0000-0000-000000000003'::UUID, -- nurse role
    id
FROM permissions
WHERE name IN (
    'patients:view',
    'clinical:view', 'clinical:update',
    'orders:view',
    'results:view',
    'scheduling:view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Receptionist permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    '00000000-0000-0000-0000-000000000004'::UUID, -- receptionist role
    id
FROM permissions
WHERE name IN (
    'patients:view', 'patients:create',
    'scheduling:view', 'scheduling:create', 'scheduling:update'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create initial super user (password: admin123 - must be changed!)
-- Password hash generated with bcrypt (cost 10) for "admin123"
INSERT INTO users (id, email, username, password_hash, is_active, is_verified, is_super_user)
VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'admin@example.com',
    'admin',
    '$2b$10$rJh8QZJHJZNJHJZNJHJZNeHJHJZNJHJZNJHJZNJHJZNJHJZNJHJZNe', -- Placeholder - will be updated with actual hash
    true,
    true,
    true
)
ON CONFLICT (email) DO NOTHING;

-- Note: The super user password hash above is a placeholder.
-- In production, generate a proper bcrypt hash and replace it.
-- You can generate one using: cargo run --bin generate-password-hash

