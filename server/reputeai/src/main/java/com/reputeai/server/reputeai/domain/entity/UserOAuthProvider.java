package com.reputeai.server.reputeai.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Tracks which OAuth providers are linked to a user account.
 * A user can have multiple providers (e.g., both Google and GitHub).
 * This allows linking OAuth accounts to existing email-based accounts.
 */
@Entity
@Table(name = "user_oauth_provider")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class UserOAuthProvider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "provider", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private AuthProvider provider;

    @Column(name = "provider_id", nullable = false, length = 255)
    private String providerId; // OAuth provider's unique ID (e.g., Google's "sub" claim)

    @Column(name = "profile_picture_url", length = 500)
    private String profilePictureUrl;

    @CreatedDate
    @Column(name = "linked_at", nullable = false, updatable = false)
    private Instant linkedAt;
}