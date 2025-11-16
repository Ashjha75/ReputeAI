package com.reputeai.server.reputeai.service;


import com.reputeai.server.reputeai.domain.dto.LoginRequestDto;
import com.reputeai.server.reputeai.domain.dto.LoginResponseDto;
import com.reputeai.server.reputeai.domain.dto.RegisterRequestDto;
import com.reputeai.server.reputeai.domain.dto.RegisterResponseDto;

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
     * Refreshes an access token using a valid refresh token.
     *
     * @param refreshToken The refresh token.
     * @return A DTO containing a new access token.
     */
    LoginResponseDto refreshToken(String refreshToken);
}