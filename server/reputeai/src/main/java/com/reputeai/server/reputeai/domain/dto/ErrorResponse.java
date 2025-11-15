package com.reputeai.server.reputeai.domain.dto;

import java.util.List;

/**
 * Standard error response payload for all API errors.
 * Provides predictable structure for clients and monitoring.
 */
public record ErrorResponse(
    String traceId,
    String errorCode,
    String message,
    List<String> details,
    long timestamp
) {}

