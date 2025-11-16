package com.reputeai.server.reputeai.domain.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for logout request to revoke a refresh token.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LogoutRequestDto {

    /**
     * The refresh token to revoke.
     */
    @NotBlank(message = "Refresh token is required")
    private String refreshToken;
}

