package com.reputeai.server.reputeai.controller;

import com.reputeai.server.reputeai.exception.BadRequestException;
import com.reputeai.server.reputeai.exception.ConflictException;
import com.reputeai.server.reputeai.exception.NotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Demo controller showing exception handling usage.
 * Remove or replace with actual business controllers.
 */
@Slf4j
@RestController
@RequestMapping("/api/demo")
@Tag(name = "Demo", description = "Demo endpoints showing exception handling")
public class DemoExceptionController {

    /**
     * Demo DTO for validation testing
     */
    public record DemoRequest(
        @NotBlank(message = "Name is required")
        String name,

        @NotBlank(message = "Email is required")
        String email
    ) {}

    @Operation(summary = "Demo endpoint - throws NotFoundException")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "404", description = "Resource not found",
            content = @Content(schema = @Schema(implementation = com.reputeai.server.reputeai.dto.ErrorResponse.class)))
    })
    @GetMapping("/not-found")
    public ResponseEntity<String> demoNotFound() {
        log.info("Demo: throwing NotFoundException");
        throw new NotFoundException("Demo resource not found");
    }

    @Operation(summary = "Demo endpoint - throws ConflictException")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "409", description = "Conflict",
            content = @Content(schema = @Schema(implementation = com.reputeai.server.reputeai.dto.ErrorResponse.class)))
    })
    @PostMapping("/conflict")
    public ResponseEntity<String> demoConflict() {
        log.info("Demo: throwing ConflictException");
        throw new ConflictException("Demo resource already exists");
    }

    @Operation(summary = "Demo endpoint - throws BadRequestException")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "400", description = "Bad request",
            content = @Content(schema = @Schema(implementation = com.reputeai.server.reputeai.dto.ErrorResponse.class)))
    })
    @GetMapping("/bad-request")
    public ResponseEntity<String> demoBadRequest() {
        log.info("Demo: throwing BadRequestException");
        throw new BadRequestException("Demo invalid input");
    }

    @Operation(summary = "Demo endpoint - validation error with @Valid")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "400", description = "Validation failed",
            content = @Content(schema = @Schema(implementation = com.reputeai.server.reputeai.dto.ErrorResponse.class)))
    })
    @PostMapping("/validation")
    public ResponseEntity<String> demoValidation(@Valid @RequestBody DemoRequest request) {
        log.info("Demo: received valid request: {}", request);
        return ResponseEntity.ok("Validation passed for: " + request.name);
    }

    @Operation(summary = "Demo endpoint - throws generic Exception (500)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "500", description = "Internal server error",
            content = @Content(schema = @Schema(implementation = com.reputeai.server.reputeai.dto.ErrorResponse.class)))
    })
    @GetMapping("/internal-error")
    public ResponseEntity<String> demoInternalError() {
        log.info("Demo: throwing generic Exception");
        throw new RuntimeException("Demo unexpected error");
    }
}

