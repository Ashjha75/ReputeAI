package com.reputeai.server.reputeai.service;


import com.reputeai.server.reputeai.domain.dto.LoginRequestDto;
import com.reputeai.server.reputeai.domain.dto.LoginResponseDto;

/**
 * Service interface for handling authentication operations.
 */
public interface AuthService {

    /**
     * Authenticates a user and returns a JWT.
     *
     * @param loginRequestDto DTO containing login credentials.
     * @return A DTO containing the access token and refresh token.
     */
    LoginResponseDto login(LoginRequestDto loginRequestDto);

    /**
     * Refreshes an access token using a valid refresh token.
     *
     * @param refreshToken The refresh token.
     * @return A DTO containing a new access token.
     */
    LoginResponseDto refreshToken(String refreshToken);
}