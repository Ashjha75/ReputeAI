package com.reputeai.server.reputeai.service.impl;

import com.reputeai.server.reputeai.constants.MessageConstants;
import com.reputeai.server.reputeai.domain.dto.LoginResponseDto;
import com.reputeai.server.reputeai.domain.entity.Role;
import com.reputeai.server.reputeai.domain.entity.User;
import com.reputeai.server.reputeai.domain.entity.UserOAuthProvider;
import com.reputeai.server.reputeai.exception.ApiException;
import com.reputeai.server.reputeai.exception.ErrorCode;
import com.reputeai.server.reputeai.repository.RoleRepository;
import com.reputeai.server.reputeai.repository.UserRepository;
import com.reputeai.server.reputeai.security.JwtProvider;
import com.reputeai.server.reputeai.security.oauth.OAuth2UserInfo;
import com.reputeai.server.reputeai.security.oauth.OAuth2UserInfoFactory;
import com.reputeai.server.reputeai.service.OAuthUserService;
import com.reputeai.server.reputeai.util.AuthProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OAuthUserServiceImpl implements OAuthUserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtProvider jwtProvider;

    @Override
    @Transactional
    public LoginResponseDto processOAuth2Login(OAuth2User oauth2User, String registrationId) {
        log.info("Processing OAuth2 login for provider: {}", registrationId);
        OAuth2UserInfo oauth2UserInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(
                registrationId,
                oauth2User.getAttributes()
        );
        String email = oauth2UserInfo.getEmail();
        if (email == null || email.isEmpty()) {
            log.error("OAuth2 login failed: Email not provided by {}", registrationId);
            throw new ApiException(
                    ErrorCode.BAD_REQUEST,
                    String.format("%s did not provide email. Please ensure email permission is granted.",
                            registrationId.toUpperCase())
            );
        }
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        String providerId = oauth2UserInfo.getProviderId();
        AuthProvider provider;
        try {
            provider = AuthProvider.valueOf(registrationId.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.error("Unsupported OAuth2 registrationId: {}", registrationId);
            throw new ApiException(ErrorCode.BAD_REQUEST, "Unsupported OAuth provider: " + registrationId);
        }
        log.debug("OAuth2 user info - email: {}, providerId: {}, provider: {}",
                normalizedEmail, providerId, provider);
        User user = userRepository.findByEmail(normalizedEmail).orElse(null);
        if (user != null) {
            return handleExistingUserOAuth2Login(user, oauth2UserInfo, provider, providerId);
        } else {
            return handleNewUserOAuth2Login(oauth2UserInfo, provider, providerId);
        }
    }

    private LoginResponseDto handleExistingUserOAuth2Login(User user,
                                                           OAuth2UserInfo oauth2UserInfo,
                                                           AuthProvider provider,
                                                           String providerId) {
        log.info("Existing user found for email: {}", user.getEmail());
        UserOAuthProvider existingOAuthProvider = user.getOAuthProvider(provider);
        if (existingOAuthProvider == null) {
            log.info("Linking {} provider to existing user: {}", provider, user.getEmail());
            UserOAuthProvider newOAuthProvider = UserOAuthProvider.builder()
                    .user(user)
                    .provider(provider)
                    .providerId(providerId)
                    .profilePictureUrl(oauth2UserInfo.getProfilePictureUrl())
                    .build();
            user.addOAuthProvider(newOAuthProvider);
            if (oauth2UserInfo.isEmailVerified() && !user.isEmailVerified()) {
                user.setEmailVerified(true);
                log.info("Email verified via {} OAuth", provider);
            }
            if (user.getProfilePictureUrl() == null) {
                user.setProfilePictureUrl(oauth2UserInfo.getProfilePictureUrl());
            }
            userRepository.save(user);
        } else {
            log.info("OAuth provider {} already linked to user: {}", provider, user.getEmail());
            String newPictureUrl = oauth2UserInfo.getProfilePictureUrl();
            if (newPictureUrl != null && !newPictureUrl.equals(existingOAuthProvider.getProfilePictureUrl())) {
                existingOAuthProvider.setProfilePictureUrl(newPictureUrl);
                user.setProfilePictureUrl(newPictureUrl);
                userRepository.save(user);
            }
        }
        if (!user.isEmailVerified()) {
            log.warn("OAuth login blocked: email not verified for {}", user.getEmail());
            throw new ApiException(ErrorCode.FORBIDDEN, MessageConstants.ERROR_EMAIL_VERIFICATION_REQUIRED);
        }
        return generateLoginResponse(user);
    }

    private LoginResponseDto handleNewUserOAuth2Login(OAuth2UserInfo oauth2UserInfo,
                                                      AuthProvider provider,
                                                      String providerId) {
        log.info("Creating new user from {} OAuth: {}", provider, oauth2UserInfo.getEmail());
        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RuntimeException("Default USER role not found"));
        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        User user = User.builder()
                .email(oauth2UserInfo.getEmail().trim().toLowerCase(Locale.ROOT))
                .firstName(oauth2UserInfo.getFirstName())
                .lastName(oauth2UserInfo.getLastName())
                .passwordHash(null)
                .isEnabled(true)
                .isEmailVerified(oauth2UserInfo.isEmailVerified())
                .profilePictureUrl(oauth2UserInfo.getProfilePictureUrl())
                .roles(roles)
                .build();
        UserOAuthProvider oauthProvider = UserOAuthProvider.builder()
                .user(user)
                .provider(provider)
                .providerId(providerId)
                .profilePictureUrl(oauth2UserInfo.getProfilePictureUrl())
                .build();
        user.addOAuthProvider(oauthProvider);
        User savedUser = userRepository.save(user);
        log.info("New OAuth user created with ID: {}", savedUser.getId());
        return generateLoginResponse(savedUser);
    }

    private LoginResponseDto generateLoginResponse(User user) {
        if (user.getId() != null) {
            MDC.put("user_id", String.valueOf(user.getId()));
        }
        try {
            String accessToken = jwtProvider.generateAccessToken(
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            user.getEmail(), null, user.getAuthorities()));
            String refreshToken = jwtProvider.createRefreshToken(user.getId()).getToken();
            String userName = user.getFirstName() != null && !user.getFirstName().isBlank()
                    ? user.getFirstName()
                    : user.getEmail();
            String welcomeMessage = String.format("Login successful! Welcome back, %s.", userName);
            log.info("JWT tokens generated for user: userId={}, email={}", user.getId(), user.getEmail());
            return new LoginResponseDto(
                    true,
                    welcomeMessage,
                    accessToken,
                    refreshToken,
                    "Bearer",
                    user.getId(),
                    user.getEmail(),
                    user.getRoles().stream().map(Role::getName).collect(Collectors.toSet())
            );
        } finally {
            MDC.remove("user_id");
        }
    }
}
