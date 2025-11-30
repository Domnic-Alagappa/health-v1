-- Rollback: Remove seed data

-- Note: This rollback removes seeded data but keeps the tables
-- The tables themselves are dropped by their respective down migrations

-- Remove role-permission assignments
DELETE FROM role_permissions WHERE role_id IN (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004'
);

-- Remove super user
DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';

-- Remove permissions (if they were created)
DELETE FROM permissions WHERE name LIKE 'patients:%' OR name LIKE 'users:%' OR name LIKE 'clinical:%' 
    OR name LIKE 'orders:%' OR name LIKE 'results:%' OR name LIKE 'pharmacy:%' 
    OR name LIKE 'scheduling:%' OR name LIKE 'revenue:%' OR name LIKE 'analytics:%' 
    OR name LIKE 'settings:%';

-- Remove roles
DELETE FROM roles WHERE id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004'
);

