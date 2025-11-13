package com.reputeai.server.reputeai.exception;

/**
 * Exception thrown when a request conflicts with existing state (e.g., duplicate username).
 * Maps to HTTP 409 CONFLICT.
 */
public final class ConflictException extends ApiException {
    public ConflictException(String message) {
        super(ErrorCode.CONFLICT, message);
    }

    public ConflictException(String message, Throwable cause) {
        super(ErrorCode.CONFLICT, message, cause);
    }
}

