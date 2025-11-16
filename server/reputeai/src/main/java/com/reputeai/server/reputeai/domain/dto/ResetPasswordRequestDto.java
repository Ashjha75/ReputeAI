package com.reputeai.server.reputeai.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordRequestDto {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String token; // password reset token

    @NotBlank
    private String newPassword;

    @NotBlank
    private String confirmPassword;
}

