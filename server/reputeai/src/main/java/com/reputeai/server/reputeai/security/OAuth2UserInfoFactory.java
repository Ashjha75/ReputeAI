package com.reputeai.server.reputeai.security;

import com.reputeai.server.reputeai.domain.entity.AuthProvider;
import com.reputeai.server.reputeai.exception.BadRequestException;

import java.util.Map;

/**
 * Factory for creating provider-specific OAuth2UserInfo implementations.
 */
public class OAuth2UserInfoFactory {

    public static OAuth2UserInfo getOAuth2UserInfo(String registrationId, Map<String, Object> attributes) {
        AuthProvider provider;
        
        try {
            provider = AuthProvider.valueOf(registrationId.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Login with " + registrationId + " is not supported");
        }

        return switch (provider) {
            case GOOGLE -> new GoogleOAuth2UserInfo(attributes);
            case GITHUB -> new GitHubOAuth2UserInfo(attributes);
            case LOCAL -> throw new BadRequestException("LOCAL is not an OAuth provider");
        };
    }
}