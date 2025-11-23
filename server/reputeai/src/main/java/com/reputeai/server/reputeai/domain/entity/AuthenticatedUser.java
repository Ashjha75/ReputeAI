package com.reputeai.server.reputeai.domain.entity;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

/**
 * Custom Principal object stored in the SecurityContext.
 * Wraps Spring Security's User and adds custom claims (e.g., jti, userId)
 * for use in service-layer security checks (ABAC, Token Revocation).
 */
public class AuthenticatedUser extends User {

    private final Long userId; // The DB ID (sub claim in JWT)
    private final String jti; // The JWT ID (for revocation check)

    public AuthenticatedUser(Long userId, String email, String password, Collection<? extends GrantedAuthority> authorities, String jti) {
        super(email, password, authorities);
        this.userId = userId;
        this.jti = jti;
    }

    public AuthenticatedUser(Long userId, String email, Collection<? extends GrantedAuthority> authorities, String jti) {
        super(email, "", authorities); // Password is not needed in the principal after auth
        this.userId = userId;
        this.jti = jti;
    }

    public Long getUserId() {
        return userId;
    }

    public String getJti() {
        return jti;
    }


}