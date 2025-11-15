package com.reputeai.server.reputeai.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for user registration requests.
 * Contains validation rules for creating a new user account.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequestDto {

    /**
     * The user's first name. Cannot be empty.
     */
    @NotBlank(message = "First name is required.")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters.")
    private String firstName;

    /**
     * The user's last name. Cannot be empty.
     */
    @NotBlank(message = "Last name is required.")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters.")
    private String lastName;

    /**
     * The user's email address. Must be a valid format and cannot be empty.
     * This will be the username for login.
     */
    @NotBlank(message = "Email is required.")
    @Email(message = "Email should be valid.")
    private String email;

    /**
     * The user's chosen password.
     * Must meet the minimum security requirements.
     */
    @NotBlank(message = "Password is required.")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters.")
    // Optional: Add @Pattern for complexity, e.g., @Pattern(regexp = "...")
    private String password;
}