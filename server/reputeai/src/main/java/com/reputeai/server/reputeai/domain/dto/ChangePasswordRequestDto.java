package com.reputeai.server.reputeai.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for changing user password.
 * Requires current password for verification and new password.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequestDto {

    /**
     * The user's current password for verification.
     * This ensures that only the authenticated user can change their password.
     */
    @NotBlank(message = "Current password is required")
    private String currentPassword;

    /**
     * The new password that will replace the current one.
     */
    @NotBlank(message = "New password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String newPassword;

    /**
     * Confirmation of the new password to prevent typos.
     */
    @NotBlank(message = "Password confirmation is required")
    private String confirmPassword;
}

