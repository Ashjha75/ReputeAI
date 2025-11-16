package com.reputeai.server.reputeai.util;

public enum ErrorCode {
    // 4xx
    VALIDATION_ERROR,
    BAD_REQUEST,
    RESOURCE_NOT_FOUND,
    EMAIL_ALREADY_EXISTS,
    UNAUTHENTICATED,
    FORBIDDEN,

    // 5xx
    DATABASE_ERROR,
    INTERNAL_SERVER_ERROR
}
