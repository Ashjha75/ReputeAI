package com.reputeai.server.reputeai.domain.dto;


import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // Don't include null fields in the JSON
public class ErrorResponse {
    private String traceId;
    private String errorCode;
    private String message;
    private List<ErrorDetail> details; // For field-specific validation errors
    private Instant timestamp;
    private boolean success = false;
}