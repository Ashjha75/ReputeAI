package com.reputeai.server.reputeai.security;

import com.reputeai.server.reputeai.security.oauth.OAuth2UserInfo;

import java.util.Map;

/**
 * Extracts user information from GitHub OAuth2 response.
 * <p>
 * Typical GitHub attributes:
 * - id: provider id (numeric or string)
 * - login: username
 * - name: full name
 * - email: email (may be null if not returned)
 * - avatar_url: profile picture URL
 */
public class GitHubOAuth2UserInfo implements OAuth2UserInfo {

    private final Map<String, Object> attributes;

    public GitHubOAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public String getProviderId() {
        Object id = attributes.get("id");
        return id == null ? null : String.valueOf(id);
    }

    @Override
    public String getEmail() {
        Object email = attributes.get("email");
        return email == null ? null : String.valueOf(email);
    }

    @Override
    public String getFirstName() {
        String name = (String) attributes.get("name");
        if (name == null || name.isBlank()) return null;
        String[] parts = name.trim().split(" ");
        return parts.length > 0 ? parts[0] : name;
    }

    @Override
    public String getLastName() {
        String name = (String) attributes.get("name");
        if (name == null || name.isBlank()) return null;
        String[] parts = name.trim().split(" ");
        return parts.length > 1 ? parts[parts.length - 1] : null;
    }

    @Override
    public String getProfilePictureUrl() {
        return (String) attributes.get("avatar_url");
    }

    @Override
    public boolean isEmailVerified() {
        // GitHub doesn't always return email_verified; assume verified if email is present.
        return getEmail() != null && !getEmail().isBlank();
    }
}

