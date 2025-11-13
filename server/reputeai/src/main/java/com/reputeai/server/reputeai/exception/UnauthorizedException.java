package com.reputeai.server.reputeai.exception;

/**
 * Exception thrown when authentication is required but missing or invalid.
 * Maps to HTTP 401 UNAUTHORIZED.
 */
public final class UnauthorizedException extends ApiException {
    public UnauthorizedException(String message) {
        super(ErrorCode.UNAUTHORIZED, message);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(ErrorCode.UNAUTHORIZED, message, cause);
    }
}

