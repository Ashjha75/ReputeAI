package com.reputeai.server.reputeai.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for registration response.
 * Contains success status and a message for the client.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterResponseDto {

    /**
     * Indicates whether the registration was successful.
     */
    private boolean success;

    /**
     * A human-readable message describing the registration result.
     * E.g., "Registration successful. Please check your email to verify your account."
     */
    private String message;
}

