-- V4__Create_Platform_Account_Table.sql
ALTER TABLE platform_account COMMENT = 'Stores OAuth2 connections to social media platforms with encrypted tokens';
-- Add comments for documentation

);
    INDEX idx_platform_connected (is_connected)
    INDEX idx_platform_type (platform_type),
    INDEX idx_platform_user (user_id),
    -- Indexes for query performance

    CONSTRAINT uk_user_platform_external UNIQUE (user_id, platform_type, external_account_id),
    -- Unique constraint: one user cannot connect the same external account twice

    CONSTRAINT fk_platform_account_user FOREIGN KEY (user_id) REFERENCES app_user (id) ON DELETE CASCADE,
    -- Foreign key to app_user table

    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata             TEXT COMMENT 'Additional platform-specific metadata as JSON',
    last_synced_at       TIMESTAMP COMMENT 'Last successful data sync from this platform',
    is_connected         BOOLEAN      NOT NULL DEFAULT TRUE,
    token_expiry         TIMESTAMP COMMENT 'When the access token expires',
    refresh_token        TEXT COMMENT 'Encrypted OAuth2 refresh token (may be null)',
    access_token         TEXT         NOT NULL COMMENT 'Encrypted OAuth2 access token',
    username             VARCHAR(255) NOT NULL,
    external_account_id  VARCHAR(255) NOT NULL,
    platform_type        VARCHAR(50)  NOT NULL,
    user_id              BIGINT       NOT NULL,
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
(
CREATE TABLE platform_account

-- Creates the table to store encrypted OAuth2 tokens for connected social media accounts
-- Migration for Phase 1: Platform Account Management

