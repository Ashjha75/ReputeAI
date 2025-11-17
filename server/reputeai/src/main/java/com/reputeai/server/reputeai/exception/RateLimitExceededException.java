package com.reputeai.server.reputeai.exception;

/**
 * Exception to be thrown when a rate limit is exceeded (HTTP 429).
 */
public class RateLimitExceededException extends RuntimeException {
    public RateLimitExceededException(String message) {
        super(message);
    }
}

