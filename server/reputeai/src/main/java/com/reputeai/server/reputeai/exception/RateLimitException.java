package com.reputeai.server.reputeai.exception;

public class RateLimitException extends ApiException {
    public RateLimitException(ErrorCode code, String message) {
        super(code, message);
    }
}

