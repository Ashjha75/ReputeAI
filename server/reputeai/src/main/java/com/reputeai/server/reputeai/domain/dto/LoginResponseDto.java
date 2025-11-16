package com.reputeai.server.reputeai.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * DTO for the response after a successful user login.
 * Contains the authentication tokens and basic user information for the client session.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDto {

    /**
     * Indicates whether the login was successful.
     * Always true in successful responses (errors use different DTOs).
     */
    private boolean success;

    /**
     * A user-friendly message about the login result.
     * Example: "Login successful! Welcome back, John."
     */
    private String message;

    /**
     * The short-lived JWT access token.
     * The client must send this in the 'Authorization: Bearer <token>' header for all subsequent secure API calls.
     */
    private String accessToken;

    /**
     * The long-lived refresh token.
     * Used to obtain a new access token when the current one expires, without requiring the user to log in again.
     */
    private String refreshToken;

    /**
     * The type of token, which is 'Bearer' according to standard practice.
     */
    private String tokenType = "Bearer";

    /**
     * The unique ID of the authenticated user.
     * Useful for frontend routing and data fetching (e.g., /users/{userId}/profile).
     */
    private Long userId;

    /**
     * The email of the authenticated user.
     * Useful for displaying in the UI (e.g., in the header dropdown).
     */
    private String email;

    /**
     * A set of roles assigned to the user (e.g., "ADMIN", "USER").
     * Used by the frontend to conditionally render UI components (e.g., show the 'Admin Panel' button).
     */
    private Set<String> roles;

    /**
     * Convenience constructor for building the response within the service layer.
     *
     * @param accessToken The generated JWT access token.
     * @param refreshToken The generated refresh token.
     * @param userId The user's ID.
     * @param email The user's email.
     * @param roles The user's roles.
     */
    public LoginResponseDto(String accessToken, String refreshToken, Long userId, String email, Set<String> roles) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.email = email;
        this.roles = roles;
    }

    /**
     * Convenience constructor for building the response when only tokens are available.
     *
     * @param accessToken The generated JWT access token.
     * @param refreshToken The generated refresh token.
     */
    public LoginResponseDto(String accessToken, String refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = "Bearer";
    }
}