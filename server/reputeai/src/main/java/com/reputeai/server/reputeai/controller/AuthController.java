package com.reputeai.server.reputeai.controller;

import com.reputeai.server.reputeai.domain.dto.*;
import com.reputeai.server.reputeai.security.JwtProvider;
import com.reputeai.server.reputeai.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication API", description = "Endpoints for user authentication and registration")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtProvider jwtProvider;

    @PostMapping("/signup")
    @Operation(
            summary = "Signup user",
            description = "Register user and return success status with message",
            responses = {
                    @ApiResponse(responseCode = "200", description = "User Registered successfully"),
                    @ApiResponse(responseCode = "400", description = "Please provide correct details"),
                    @ApiResponse(responseCode = "409", description = "Email already in use"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    public ResponseEntity<RegisterResponseDto> signUp(@RequestBody @Validated RegisterRequestDto registerRequestDto) {
        return ResponseEntity.ok(authService.register(registerRequestDto));
    }

    @PostMapping("/login")
    @Operation(
            summary = "Authenticate user and obtain JWT tokens",
            description = "Login with email and password. Returns access token and refresh token.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Login successful"),
                    @ApiResponse(responseCode = "401", description = "Invalid credentials"),
                    @ApiResponse(responseCode = "403", description = "Account disabled"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    public ResponseEntity<LoginResponseDto> login(@Valid @RequestBody LoginRequestDto request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    @Operation(
            summary = "Refresh access token",
            description = "Use a refresh token to obtain a new access token without re-authentication",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Token refreshed successfully"),
                    @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    public ResponseEntity<RefreshTokenResponseDto> refreshToken(@Valid @RequestBody RefreshTokenRequestDto request) {
        String newAccessToken = jwtProvider.refreshAccessToken(request.getRefreshToken());
        return ResponseEntity.ok(new RefreshTokenResponseDto(newAccessToken));
    }

    @PostMapping("/logout")
    @Operation(
            summary = "Logout user",
            description = "Revoke the refresh token to logout from current device",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Logout successful"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    public ResponseEntity<RegisterResponseDto> logout(@Valid @RequestBody LogoutRequestDto request) {
        jwtProvider.deleteRefreshToken(request.getRefreshToken());
        return ResponseEntity.ok(new RegisterResponseDto(true, "Logout successful"));
    }

    @PostMapping("/request-email-verification")
    @Operation(summary = "Request email verification OTP", description = "Generates and sends (simulated) an OTP to verify email.")
    public ResponseEntity<SimpleSuccessResponseDto> requestEmailVerification(@RequestParam("email") String email) {
        return ResponseEntity.ok(authService.requestEmailVerification(email));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email via OTP", description = "Verifies email using a valid OTP.")
    public ResponseEntity<SimpleSuccessResponseDto> verifyEmail(@Valid @RequestBody VerifyEmailRequestDto request) {
        return ResponseEntity.ok(authService.verifyEmailOtp(request));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot password", description = "Initiate password reset by generating a token (simulated)")
    public ResponseEntity<SimpleSuccessResponseDto> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDto request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Reset password using provided token.")
    public ResponseEntity<SimpleSuccessResponseDto> resetPassword(@Valid @RequestBody ResetPasswordRequestDto request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }
}
