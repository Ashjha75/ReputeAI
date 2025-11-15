package com.reputeai.server.reputeai.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for user login requests.
 * Contains credentials required for authentication.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequestDto {

    /**
     * The user's registered email address.
     * Must be a valid email format and cannot be empty.
     */
    @NotBlank(message = "Email is required.")
    @Email(message = "Please provide a valid email address.")
    private String email;

    /**
     * The user's password.
     * Cannot be empty.
     */
    @NotBlank(message = "Password is required.")
    private String password;
}