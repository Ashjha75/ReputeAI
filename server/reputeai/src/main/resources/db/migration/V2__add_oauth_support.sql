-- V2__add_oauth_support.sql
-- Adds OAuth2 support while keeping email unique

-- 1. Add OAuth-related columns to app_user
ALTER TABLE app_user
    ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE NOT NULL AFTER is_enabled,
    ADD COLUMN profile_picture_url VARCHAR(500) AFTER is_email_verified,
    -- password_hash becomes nullable (OAuth users don't have passwords)
    MODIFY COLUMN password_hash VARCHAR(255) NULL;

-- 2. Create table to track OAuth providers linked to each user
-- A user can have multiple providers (Google + GitHub) linked to same email
CREATE TABLE user_oauth_provider (
                                     id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                     user_id BIGINT NOT NULL,
                                     provider VARCHAR(20) NOT NULL,  -- 'GOOGLE', 'GITHUB'
                                     provider_id VARCHAR(255) NOT NULL,  -- Provider's unique ID for this user
                                     profile_picture_url VARCHAR(500),
                                     linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

                                     CONSTRAINT fk_user_oauth_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
                                     CONSTRAINT uq_provider_provider_id UNIQUE (provider, provider_id),
                                     CONSTRAINT uq_user_provider UNIQUE (user_id, provider)
);

-- 3. Create index for faster OAuth provider lookups
CREATE INDEX idx_user_oauth_provider ON user_oauth_provider(provider, provider_id);

-- 4. Add refresh token table (if not already exists)
CREATE TABLE IF NOT EXISTS refresh_token (
                                             id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                             user_id BIGINT NOT NULL,
                                             token VARCHAR(500) NOT NULL UNIQUE,
                                             expiry_date TIMESTAMP NOT NULL,
                                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

                                             CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

-- 5. Add index for refresh token expiry cleanup
CREATE INDEX idx_refresh_token_expiry ON refresh_token(expiry_date);