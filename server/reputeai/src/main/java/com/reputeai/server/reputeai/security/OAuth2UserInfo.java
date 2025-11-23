package com.reputeai.server.reputeai.security;

/**
 * Abstract interface for extracting user information from different OAuth2 providers.
 * Each provider (Google, GitHub) has different attribute names.
 */
public interface OAuth2UserInfo {
    String getProviderId();
    String getEmail();
    String getFirstName();
    String getLastName();
    String getProfilePictureUrl();
    boolean isEmailVerified();
}