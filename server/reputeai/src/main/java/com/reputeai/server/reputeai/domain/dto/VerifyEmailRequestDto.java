package com.reputeai.server.reputeai.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyEmailRequestDto {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String otp;
}

