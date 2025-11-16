-- This is your second migration. It seeds the database with foundational roles, permissions, and their mappings.

-- 1. SEED PERMISSIONS (The specific actions users can take)
INSERT INTO permission (name) VALUES
                                  ('user:read'), ('user:create'), ('user:update'), ('user:delete'),
                                  ('role:read'), ('role:update'),
                                  ('account:read'), ('account:create'), ('account:delete'), ('account:refresh'),
                                  ('post:read'), ('post:delete'), ('analysis:run');

-- 2. MAP PERMISSIONS TO ROLES

-- Assign permissions to the 'USER' role
INSERT INTO role_permission (role_id, permission_id)
SELECT
    (SELECT id FROM role WHERE name = 'USER'),
    p.id
FROM permission p
WHERE p.name IN (
                 'account:read',
                 'account:create',
                 'account:delete',
                 'account:refresh',
                 'post:read',
                 'analysis:run'
    );

-- Assign ALL permissions to the 'ADMIN' role
INSERT INTO role_permission (role_id, permission_id)
SELECT
    (SELECT id FROM role WHERE name = 'ADMIN'),
    p.id
FROM permission p;

-- Assign READ-ONLY permissions to the 'AUDITOR' role
INSERT INTO role_permission (role_id, permission_id)
SELECT
    (SELECT id FROM role WHERE name = 'AUDITOR'),
    p.id
FROM permission p
WHERE p.name LIKE '%:read';