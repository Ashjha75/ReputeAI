package com.reputeai.server.reputeai.service;

import com.reputeai.server.reputeai.domain.dto.*;
import org.springframework.security.oauth2.core.user.OAuth2User;

/**
 * Service interface for handling authentication operations.
 */
public interface AuthService {

    /**
     * Register a new user with LOCAL authentication.
     */
    RegisterResponseDto register(RegisterRequestDto registerRequestDto);

    /**
     * Authenticates a user with LOCAL credentials and returns JWT tokens.
     */
    LoginResponseDto login(LoginRequestDto loginRequestDto);

    /**
     * Refresh access token using refresh token.
     */
    RefreshTokenResponseDto refreshToken(String refreshToken);

    /**
     * Logout user by invalidating refresh token.
     */
    void logout(String refreshToken);

    /**
     * Request OTP for email verification (public).
     */
    SimpleSuccessResponseDto requestEmailVerification(String email);

    /**
     * Verify OTP and mark email as verified (public).
     */
    SimpleSuccessResponseDto verifyEmailOtp(VerifyEmailRequestDto request);

    /**
     * Initiate forgot password (public).
     */
    SimpleSuccessResponseDto forgotPassword(ForgotPasswordRequestDto request);

    /**
     * Perform password reset with token (public).
     */
    SimpleSuccessResponseDto resetPassword(ResetPasswordRequestDto request);

    /**
     * Process OAuth2 login - create/update user and generate JWT tokens.
     * Handles email uniqueness and provider linking.
     */
    LoginResponseDto processOAuth2Login(OAuth2User oauth2User, String registrationId);
}