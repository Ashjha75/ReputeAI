-- This is your first migration. It creates the foundational tables for the application.

-- 1. ROLE and PERMISSION tables
CREATE TABLE IF NOT EXISTS role (
                      id BIGINT AUTO_INCREMENT PRIMARY KEY,
                      name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS permission (
                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                            name VARCHAR(100) NOT NULL UNIQUE
);

-- 2. USER table
CREATE TABLE IF NOT EXISTS app_user (
                          id BIGINT AUTO_INCREMENT PRIMARY KEY,
                          email VARCHAR(255) NOT NULL UNIQUE,
                          password_hash VARCHAR(255) NOT NULL,
                          first_name VARCHAR(100) NOT NULL,
                          last_name VARCHAR(100) NOT NULL,
                          is_enabled BOOLEAN DEFAULT TRUE,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
                          created_by BIGINT
);

-- 3. MAPPING tables for RBAC
CREATE TABLE IF NOT EXISTS user_role (
                           user_id BIGINT NOT NULL,
                           role_id BIGINT NOT NULL,
                           PRIMARY KEY (user_id, role_id),
                           CONSTRAINT fk_userrole_user FOREIGN KEY (user_id) REFERENCES app_user(id),
                           CONSTRAINT fk_userrole_role FOREIGN KEY (role_id) REFERENCES role(id)
);

CREATE TABLE IF NOT EXISTS role_permission (
                                 role_id BIGINT NOT NULL,
                                 permission_id BIGINT NOT NULL,
                                 PRIMARY KEY (role_id, permission_id),
                                 CONSTRAINT fk_rolepermission_role FOREIGN KEY (role_id) REFERENCES role(id),
                                 CONSTRAINT fk_rolepermission_permission FOREIGN KEY (permission_id) REFERENCES permission(id)
);

-- Seed the basic role names immediately after creating the table
INSERT INTO role (name) VALUES ('USER'), ('ADMIN'), ('AUDITOR');