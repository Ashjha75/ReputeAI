package com.reputeai.server.reputeai.service;

import com.reputeai.server.reputeai.domain.dto.LoginResponseDto;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Map;

/**
 * Service interface for handling OAuth2 user login operations.
 */
public interface OAuthUserService {
    LoginResponseDto processOAuth2Login(OAuth2User oauth2User, String registrationId);

    /**
     * Overloaded method to process OAuth2 login with additional user attributes.
     *
     * @param oauth2User    the OAuth2 user information
     * @param registrationId the registration ID of the OAuth2 provider
     * @param attributes     additional attributes from the OAuth2 provider
     * @return LoginResponseDto containing the login response information
     */
    LoginResponseDto processOAuth2Login(OAuth2User oauth2User, String registrationId, Map<String, Object> attributes);
}
