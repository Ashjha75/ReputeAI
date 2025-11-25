package com.reputeai.server.reputeai.domain.entity;

import com.reputeai.server.reputeai.util.AuthProvider;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Core Authentication ---
    @Column(name = "email", unique = true, nullable = false)
    private String email; // UNIQUE globally - one email = one account

    @Column(name = "password_hash", nullable = true) // ✅ NULLABLE for OAuth users
    private String passwordHash;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private boolean isEnabled = true;

    @Column(name = "is_email_verified", nullable = false)
    @Builder.Default
    private boolean isEmailVerified = false;

    @Column(name = "profile_picture_url", length = 500)
    private String profilePictureUrl;

    // --- OAuth Provider Tracking ---
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private Set<UserOAuthProvider> oauthProviders = new HashSet<>();

    // --- Authorization (RBAC) ---
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_role",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    // --- Auditing ---
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @CreatedBy
    @Column(name = "created_by")
    private Long createdBy;

    // --- Helper Methods ---

    /**
     * Check if user has LOCAL password authentication.
     */
    public boolean hasLocalAuth() {
        return passwordHash != null && !passwordHash.isEmpty();
    }

    /**
     * Check if user has specific OAuth provider linked.
     */
    public boolean hasOAuthProvider(AuthProvider provider) {
        return oauthProviders.stream()
                .anyMatch(oauth -> oauth.getProvider() == provider);
    }

    /**
     * Get OAuth provider info for specific provider.
     */
    public UserOAuthProvider getOAuthProvider(AuthProvider provider) {
        return oauthProviders.stream()
                .filter(oauth -> oauth.getProvider() == provider)
                .findFirst()
                .orElse(null);
    }

    /**
     * Add OAuth provider to user.
     */
    public void addOAuthProvider(UserOAuthProvider oauthProvider) {
        oauthProviders.add(oauthProvider);
        oauthProvider.setUser(this);
    }

    // --- UserDetails Implementation ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.roles;
    }

    @Override
    public String getPassword() {
        // Return empty string instead of null for OAuth users to avoid Spring Security validation errors
        return this.passwordHash != null ? this.passwordHash : "";
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return this.isEnabled;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return this.isEnabled;
    }
}