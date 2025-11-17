package com.reputeai.server.reputeai.exception;

/**
 * Centralized error codes for all API errors.
 * Used in ErrorResponse.errorCode and OpenAPI documentation.
 */
public enum ErrorCode {
    VALIDATION_ERROR,
    RESOURCE_NOT_FOUND,
    CONFLICT,
    UNAUTHORIZED,
    FORBIDDEN,
    BAD_REQUEST,
    UNAUTHENTICATED,
    INTERNAL_SERVER_ERROR,
    DATA_ACCESS_ERROR,
    RATE_LIMIT_EXCEEDED
}

