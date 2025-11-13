package com.reputeai.server.reputeai.exception;

/**
 * Exception thrown when the authenticated user lacks permission for the requested operation.
 * Maps to HTTP 403 FORBIDDEN.
 */
public final class ForbiddenException extends ApiException {
    public ForbiddenException(String message) {
        super(ErrorCode.FORBIDDEN, message);
    }

    public ForbiddenException(String message, Throwable cause) {
        super(ErrorCode.FORBIDDEN, message, cause);
    }
}

