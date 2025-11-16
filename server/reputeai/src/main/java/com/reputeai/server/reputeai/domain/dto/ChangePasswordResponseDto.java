package com.reputeai.server.reputeai.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for change password response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordResponseDto {

    /**
     * Indicates whether the password change was successful.
     */
    private boolean success;

    /**
     * A user-friendly message about the password change result.
     */
    private String message;
}

