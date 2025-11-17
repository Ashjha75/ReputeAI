package com.reputeai.server.reputeai.exception;

import com.giffing.bucket4j.spring.boot.starter.context.RateLimitException;
import com.reputeai.server.reputeai.domain.dto.ErrorDetail;
import com.reputeai.server.reputeai.domain.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Validation errors (400) — returns list of field errors
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex,
                                                                   HttpServletRequest request) {
        List<ErrorDetail> details = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> new ErrorDetail(fe.getField(), fe.getDefaultMessage()))
                .collect(Collectors.toList());

        log.warn("Validation failed for {}: {}", request.getRequestURI(), details);
        ErrorResponse body = build(ErrorCode.VALIDATION_ERROR, "Request validation failed", details);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // Malformed JSON (400)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleMalformedJson(HttpMessageNotReadableException ex,
                                                             HttpServletRequest request) {
        log.warn("Malformed JSON for {}: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse body = build(ErrorCode.BAD_REQUEST, "Request body is malformed or contains invalid JSON", null);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // Bad credentials (401)
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex,
                                                              HttpServletRequest request) {
        log.warn("Authentication failed for {}: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse body = build(ErrorCode.UNAUTHORIZED, "Invalid credentials", null);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    // Access denied (403)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex,
                                                            HttpServletRequest request) {
        log.warn("Access denied for {}: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse body = build(ErrorCode.FORBIDDEN, "You do not have permission to access this resource", null);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    // DB constraint or explicit conflict (409)
//    @ExceptionHandler({DataIntegrityViolationException.class, EmailAlreadyExistsException.class})
//    public ResponseEntity<ErrorResponse> handleConflict(Exception ex, HttpServletRequest request) {
//        log.warn("Data conflict for {}: {}", request.getRequestURI(), ex.getMessage());
//        ErrorResponse body = build(ErrorCode.DATABASE_ERROR, "Resource conflict: the resource likely already exists", null);
//        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
//    }

    // Application-specific ApiException — map to appropriate HTTP status
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex, HttpServletRequest request) {
        ErrorCode code = ex.getCode();
        HttpStatus status = mapToHttpStatus(code);
        log.warn("API exception for {}: code={}, message={}", request.getRequestURI(), code, ex.getMessage());
        ErrorResponse body = build(code, ex.getMessage(), null);
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(RateLimitException.class)
    public ResponseEntity<ErrorResponse> handleRateLimitException(RateLimitException ex, HttpServletRequest request) {
        ErrorCode code = ErrorCode.RATE_LIMIT_EXCEEDED;
        HttpStatus status = mapToHttpStatus(code);
        log.warn("Rate Limit exception for {} from IP {}: User is blocked for 5 minutes",
            request.getRequestURI(), request.getRemoteAddr());
        ErrorResponse body = build(code, "Too many requests. Please try again after 5 minutes.", null);
        return ResponseEntity.status(status).body(body);
    }

    // Catch-all (500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception for {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        ErrorResponse body = build(ErrorCode.INTERNAL_SERVER_ERROR,
                "An unexpected internal error occurred. Provide the traceId to support.",
                null);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }


    /* Helper: create ErrorResponse and attach traceId from MDC */
    private ErrorResponse build(ErrorCode code, String message, List<ErrorDetail> details) {
        return new ErrorResponse(
                MDC.get("traceId"),
                code.name(),
                message,
                details,
                Instant.now(),
                false
        );
    }

    /* Helper: map ErrorCode -> HttpStatus for ApiException cases */
    private HttpStatus mapToHttpStatus(ErrorCode code) {
        return switch (code) {
            case VALIDATION_ERROR, BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case CONFLICT -> HttpStatus.CONFLICT;
            case UNAUTHORIZED, UNAUTHENTICATED -> HttpStatus.UNAUTHORIZED;
            case FORBIDDEN -> HttpStatus.FORBIDDEN;
            case RESOURCE_NOT_FOUND -> HttpStatus.NOT_FOUND;
            case RATE_LIMIT_EXCEEDED -> HttpStatus.TOO_MANY_REQUESTS;
            case INTERNAL_SERVER_ERROR, DATA_ACCESS_ERROR -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
    }
}
