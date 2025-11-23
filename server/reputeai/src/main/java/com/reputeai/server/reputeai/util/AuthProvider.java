package com.reputeai.server.reputeai.util;

/**
 * Enum representing authentication providers.
 * Used to track how a user registered and which OAuth providers are linked.
 */
public enum AuthProvider {
    LOCAL,      // Traditional username/password
    GOOGLE,     // Google OAuth2
    GITHUB      // GitHub OAuth2
}