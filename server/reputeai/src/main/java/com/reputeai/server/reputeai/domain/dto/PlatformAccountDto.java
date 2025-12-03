package com.reputeai.server.reputeai.domain.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for returning platform account information to the frontend.
 * Does NOT include sensitive tokens - only metadata for display.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformAccountDto {

    private Long id;

    private String platformType;

    private String username;

    private Boolean isConnected;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private Instant lastSyncedAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private Instant createdAt;
}

