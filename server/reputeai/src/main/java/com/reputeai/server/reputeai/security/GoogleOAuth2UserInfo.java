package com.reputeai.server.reputeai.security;

import com.reputeai.server.reputeai.util.OAuth2UserInfo;

import java.util.Map;

/**
 * Extracts user information from Google OAuth2 response.
 * 
 * Google OAuth2 attributes:
 * - sub: Unique Google user ID
 * - email: User's email
 * - email_verified: Boolean
 * - given_name: First name
 * - family_name: Last name
 * - picture: Profile picture URL
 */
public class GoogleOAuth2UserInfo implements OAuth2UserInfo {

    private final Map<String, Object> attributes;

    public GoogleOAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public String getProviderId() {
        return (String) attributes.get("sub");
    }

    @Override
    public String getEmail() {
        return (String) attributes.get("email");
    }

    @Override
    public String getFirstName() {
        return (String) attributes.get("given_name");
    }

    @Override
    public String getLastName() {
        return (String) attributes.get("family_name");
    }

    @Override
    public String getProfilePictureUrl() {
        return (String) attributes.get("picture");
    }

    @Override
    public boolean isEmailVerified() {
        Boolean verified = (Boolean) attributes.get("email_verified");
        return verified != null && verified;
    }
}