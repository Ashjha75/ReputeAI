package com.reputeai.server.reputeai.controller;

import com.reputeai.server.reputeai.domain.dto.ChangePasswordRequestDto;
import com.reputeai.server.reputeai.domain.dto.ChangePasswordResponseDto;
import com.reputeai.server.reputeai.domain.dto.UserProfileDto;
import com.reputeai.server.reputeai.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "User Management API", description = "Endpoints for user profile and account management")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/info")
    @Operation(
            summary = "Get current user profile",
            description = "Returns the profile information of the currently authenticated user. Excludes sensitive data like password hash.",
            security = @SecurityRequirement(name = "Bearer Authentication"),
            responses = {
                    @ApiResponse(responseCode = "200", description = "User profile retrieved successfully"),
                    @ApiResponse(responseCode = "401", description = "Unauthorized (not authenticated)"),
                    @ApiResponse(responseCode = "404", description = "User not found"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    public ResponseEntity<UserProfileDto> getCurrentUserProfile(Authentication authentication) {
        // Get the logged-in user's email from the JWT token
        String userEmail = authentication.getName();

        // Fetch user profile (safe data only)
        UserProfileDto profile = userService.getUserProfile(userEmail);

        return ResponseEntity.ok(profile);
    }

    @PutMapping("/change-password")
    @Operation(
            summary = "Change user password",
            description = "Allows authenticated users to change their password. Requires current password for verification.",
            security = @SecurityRequirement(name = "Bearer Authentication"),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Password changed successfully"),
                    @ApiResponse(responseCode = "400", description = "Invalid request (passwords don't match or invalid format)"),
                    @ApiResponse(responseCode = "401", description = "Unauthorized (invalid current password or not authenticated)"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    public ResponseEntity<ChangePasswordResponseDto> changePassword(
            @Valid @RequestBody ChangePasswordRequestDto request,
            Authentication authentication) {

        // Get the logged-in user's email from the JWT token
        String userEmail = authentication.getName();

        // Change the password
        userService.changePassword(userEmail, request);

        // Return success response
        return ResponseEntity.ok(new ChangePasswordResponseDto(
                true,
                "Password changed successfully"
        ));
    }
}

