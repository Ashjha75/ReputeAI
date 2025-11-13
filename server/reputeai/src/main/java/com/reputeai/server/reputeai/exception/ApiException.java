package com.reputeai.server.reputeai.exception;

/**
 * Base exception for all API-level exceptions.
 * All custom exceptions should extend this to ensure consistent error handling.
 */
public abstract class ApiException extends RuntimeException {
    private final ErrorCode code;

    public ApiException(ErrorCode code, String message) {
        super(message);
        this.code = code;
    }

    public ApiException(ErrorCode code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public ErrorCode getCode() {
        return code;
    }
}

