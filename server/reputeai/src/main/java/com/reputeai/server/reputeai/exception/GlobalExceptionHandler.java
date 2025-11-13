package com.reputeai.server.reputeai.exception;

import com.reputeai.server.reputeai.dto.ErrorResponse;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;

/**
 * Global exception handler for all API exceptions.
 * Centralizes error mapping, logging, and response formatting.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Build standardized error response with traceId from MDC.
     */
    private ErrorResponse build(ErrorCode code, String message, List<String> details) {
        String traceId = MDC.get("traceId");
        return new ErrorResponse(
            traceId != null ? traceId : "N/A",
            code.name(),
            message,
            details == null ? List.of() : details,
            Instant.now().toEpochMilli()
        );
    }

    /**
     * Handle all custom ApiException subtypes (NotFoundException, ConflictException, etc.).
     */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex) {
        ErrorResponse body = build(ex.getCode(), ex.getMessage(), null);
        HttpStatus status = mapStatus(ex.getCode());
        log.warn("API error: {} - {}", ex.getCode(), ex.getMessage());
        return ResponseEntity.status(status).body(body);
    }

    /**
     * Handle Spring validation errors (@Valid on DTOs).
     * Returns field-level validation messages.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        List<String> details = ex.getBindingResult().getFieldErrors()
            .stream()
            .map(f -> f.getField() + ": " + f.getDefaultMessage())
            .toList();
        ErrorResponse body = build(ErrorCode.VALIDATION_ERROR, "Validation failed", details);
        log.info("Validation failed: {}", details);
        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Handle malformed JSON and constraint violations.
     */
    @ExceptionHandler({HttpMessageNotReadableException.class, ConstraintViolationException.class})
    public ResponseEntity<ErrorResponse> handleBadRequest(Exception ex) {
        ErrorResponse body = build(ErrorCode.BAD_REQUEST, ex.getMessage(), null);
        log.info("Bad request: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Handle database/data access errors.
     */
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ErrorResponse> handleDataAccessException(DataAccessException ex) {
        List<String> details = List.of(ex.getMostSpecificCause().getMessage());
        ErrorResponse body = build(ErrorCode.DATA_ACCESS_ERROR, "Data error", details);
        log.error("Data access error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    /**
     * Catch-all for unexpected exceptions.
     * Never expose internal details to clients.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        ErrorResponse body = build(ErrorCode.INTERNAL_ERROR, "Internal server error", null);
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    /**
     * Map ErrorCode to HTTP status code.
     */
    private HttpStatus mapStatus(ErrorCode code) {
        return switch (code) {
            case VALIDATION_ERROR, BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case RESOURCE_NOT_FOUND -> HttpStatus.NOT_FOUND;
            case CONFLICT -> HttpStatus.CONFLICT;
            case UNAUTHORIZED -> HttpStatus.UNAUTHORIZED;
            case FORBIDDEN -> HttpStatus.FORBIDDEN;
            case DATA_ACCESS_ERROR, INTERNAL_ERROR -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
    }
}

