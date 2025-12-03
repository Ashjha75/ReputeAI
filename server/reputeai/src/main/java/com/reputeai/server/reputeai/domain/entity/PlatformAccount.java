package com.reputeai.server.reputeai.domain.entity;

import com.reputeai.server.reputeai.constants.PlatformType;
import com.reputeai.server.reputeai.util.EncryptedStringConverter;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Entity representing a connected social media platform account.
 * Stores encrypted access tokens and refresh tokens for OAuth2 integrations.
 */
@Entity
@Table(name = "platform_account",
        uniqueConstraints = {
            @UniqueConstraint(columnNames = {"user_id", "platform_type", "external_account_id"})
        },
        indexes = {
            @Index(name = "idx_platform_user", columnList = "user_id"),
            @Index(name = "idx_platform_type", columnList = "platform_type"),
            @Index(name = "idx_platform_connected", columnList = "is_connected")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class PlatformAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The ReputeAI user who owns this platform connection
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * The type of social media platform (Twitter, GitHub, etc.)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "platform_type", nullable = false, length = 50)
    private PlatformType platformType;

    /**
     * The unique identifier for this account on the external platform
     * (e.g., Twitter user ID, GitHub user ID)
     */
    @Column(name = "external_account_id", nullable = false, length = 255)
    private String externalAccountId;

    /**
     * The username or handle on the external platform
     * (e.g., @twitter_handle, github_username)
     */
    @Column(name = "username", nullable = false, length = 255)
    private String username;

    /**
     * OAuth2 access token - ENCRYPTED at rest
     * Uses custom converter to automatically encrypt/decrypt
     */
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "access_token", nullable = false, columnDefinition = "TEXT")
    private String accessToken;

    /**
     * OAuth2 refresh token - ENCRYPTED at rest
     * May be null for some OAuth2 flows that don't provide refresh tokens
     */
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;

    /**
     * When the access token expires
     * Used to trigger token refresh before API calls
     */
    @Column(name = "token_expiry")
    private Instant tokenExpiry;

    /**
     * Whether this account is currently connected and active
     */
    @Column(name = "is_connected", nullable = false)
    @Builder.Default
    private Boolean isConnected = true;

    /**
     * Last time we successfully synced/fetched data from this platform
     */
    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;

    /**
     * Additional metadata from the platform (profile picture, bio, etc.)
     * Stored as JSON string
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    // --- Auditing ---
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Marks this account as disconnected
     */
    public void disconnect() {
        this.isConnected = false;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
    }

    /**
     * Updates the OAuth tokens (used during token refresh)
     */
    public void updateTokens(String accessToken, String refreshToken, Instant tokenExpiry) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiry = tokenExpiry;
    }
}

