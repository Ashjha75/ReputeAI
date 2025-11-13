package com.reputeai.server.reputeai.exception;

/**
 * Exception thrown when a requested resource is not found.
 * Maps to HTTP 404 NOT_FOUND.
 */
public final class NotFoundException extends ApiException {
    public NotFoundException(String message) {
        super(ErrorCode.RESOURCE_NOT_FOUND, message);
    }

    public NotFoundException(String message, Throwable cause) {
        super(ErrorCode.RESOURCE_NOT_FOUND, message, cause);
    }
}

