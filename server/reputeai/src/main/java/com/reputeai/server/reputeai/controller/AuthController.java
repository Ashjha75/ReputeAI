package com.reputeai.server.reputeai.controller;

import com.reputeai.server.reputeai.domain.dto.LoginRequestDto;
import com.reputeai.server.reputeai.domain.dto.LoginResponseDto;
import com.reputeai.server.reputeai.domain.dto.RegisterRequestDto;
import com.reputeai.server.reputeai.domain.dto.RegisterResponseDto;
import com.reputeai.server.reputeai.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication API", description = "Endpoints for user authentication and registration")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

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
    @Operation(summary = "Authenticate user and obtain JWT tokens")
    public ResponseEntity<LoginResponseDto> login(@Valid @RequestBody LoginRequestDto request) {
        return authService.login(request);
    }
}
