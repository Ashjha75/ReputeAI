package com.reputeai.server.reputeai.exception;

/**
 * Exception thrown when the client sends a malformed or invalid request.
 * Maps to HTTP 400 BAD_REQUEST.
 */
public final class BadRequestException extends ApiException {
    public BadRequestException(String message) {
        super(ErrorCode.BAD_REQUEST, message);
    }

    public BadRequestException(String message, Throwable cause) {
        super(ErrorCode.BAD_REQUEST, message, cause);
    }
}

