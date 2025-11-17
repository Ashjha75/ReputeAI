package com.reputeai.server.reputeai.service;


import com.reputeai.server.reputeai.domain.dto.*; // wildcard import for DTOs
import org.springframework.http.ResponseEntity;

/**
 * Service interface for handling authentication operations.
 */
public interface AuthService {

    /**
     * Register a user .
     *
     * @param registerRequestDto DTO containing register body.
     * @return A DTO containing success status and message.
     */
    RegisterResponseDto register(RegisterRequestDto registerRequestDto);


    /**
     * Authenticates a user and returns a JWT.
     *
     * @param loginRequestDto DTO containing login credentials.
     * @return A DTO containing the access token and refresh token.
     */
    LoginResponseDto login(LoginRequestDto loginRequestDto);

    /**
     * Refresh access token using refresh token.
     *
     * @param refreshToken The refresh token string
     * @return New access token response
     */
    RefreshTokenResponseDto refreshToken(String refreshToken);

    /**
     * Logout user by invalidating refresh token.
     *
     * @param refreshToken The refresh token to invalidate
     */
    void logout(String refreshToken);

    // Request OTP for email verification (public)
    SimpleSuccessResponseDto requestEmailVerification(String email);

    // Verify OTP and mark email as verified (public)
    SimpleSuccessResponseDto verifyEmailOtp(VerifyEmailRequestDto request);

    // Initiate forgot password (public)
    SimpleSuccessResponseDto forgotPassword(ForgotPasswordRequestDto request);

    // Perform password reset with token (public)
    SimpleSuccessResponseDto resetPassword(ResetPasswordRequestDto request);
}