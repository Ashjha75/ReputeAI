package com.reputeai.server.reputeai.service;

import com.reputeai.server.reputeai.domain.dto.LoginResponseDto;
import org.springframework.security.oauth2.core.user.OAuth2User;

/**
 * Service interface for handling OAuth2 user login operations.
 */
public interface OAuthUserService {
    LoginResponseDto processOAuth2Login(OAuth2User oauth2User, String registrationId);
}

