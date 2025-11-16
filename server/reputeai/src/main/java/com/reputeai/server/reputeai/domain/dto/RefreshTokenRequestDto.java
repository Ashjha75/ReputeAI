package com.reputeai.server.reputeai.domain.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for requesting a new access token using a refresh token.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenRequestDto {

    /**
     * The refresh token received during login.
     */
    @NotBlank(message = "Refresh token is required")
    private String refreshToken;
}

