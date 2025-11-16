package com.reputeai.server.reputeai.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for the response after successfully refreshing an access token.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenResponseDto {

    /**
     * Indicates whether the token refresh was successful.
     */
    private boolean success;

    /**
     * A user-friendly message about the refresh result.
     */
    private String message;

    /**
     * The new JWT access token.
     */
    private String accessToken;

    /**
     * The type of token, which is 'Bearer'.
     */
    private String tokenType = "Bearer";

    /**
     * Constructor with just accessToken (sets default success=true and message).
     */
    public RefreshTokenResponseDto(String accessToken) {
        this.success = true;
        this.message = "Access token refreshed successfully";
        this.accessToken = accessToken;
        this.tokenType = "Bearer";
    }
}

