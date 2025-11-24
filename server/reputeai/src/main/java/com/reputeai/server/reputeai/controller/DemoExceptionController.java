package com.reputeai.server.reputeai.controller;

import com.reputeai.server.reputeai.domain.dto.ErrorResponse;
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

    @Operation(summary = "Demo endpoint - throws NotFoundException", description = "Always returns 404 with a standardized error response.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "404", description = "Resource not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/not-found")
    public ResponseEntity<Void> demoNotFound() {
        log.info("Demo: throwing NotFoundException");
        throw new NotFoundException("Demo resource not found");
    }

    @Operation(summary = "Demo endpoint - throws ConflictException", description = "Always returns 409 with a standardized error response.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "409", description = "Conflict",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/conflict")
    public ResponseEntity<Void> demoConflict() {
        log.info("Demo: throwing ConflictException");
        throw new ConflictException("Demo resource already exists");
    }

    @Operation(summary = "Demo endpoint - throws BadRequestException", description = "Always returns 400 with a standardized error response.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "400", description = "Bad request",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/bad-request")
    public ResponseEntity<Void> demoBadRequest() {
        log.info("Demo: throwing BadRequestException");
        throw new BadRequestException("Demo invalid input");
    }

    @Operation(summary = "Demo endpoint - validation error with @Valid", description = "Returns 400 with field-level validation errors if input is invalid.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Validation passed", content = @Content(schema = @Schema(implementation = String.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/validation")
    public ResponseEntity<String> demoValidation(@Valid @RequestBody DemoRequest request) {
        log.info("Demo: received valid request: {}", request);
        return ResponseEntity.ok("Validation passed for: " + request.name());
    }

    @Operation(summary = "Demo endpoint - throws generic Exception (500)", description = "Always returns 500 with a standardized error response.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "500", description = "Internal server error",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/internal-error")
    public ResponseEntity<Void> demoInternalError() {
        log.info("Demo: throwing generic Exception");
        throw new RuntimeException("Demo unexpected error");
    }

    @Operation(summary = "Demo endpoint - success", description = "Returns a successful response for Swagger demonstration.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success", content = @Content(schema = @Schema(implementation = String.class)))
    })
    @GetMapping("/success")
    public ResponseEntity<String> demoSuccess() {
        return ResponseEntity.ok("Demo success response");
    }

    /**
     * Demo DTO for validation testing
     */
    public record DemoRequest(
            @NotBlank(message = "Name is required")
            String name,

            @NotBlank(message = "Email is required")
            String email
    ) {
    }
}
