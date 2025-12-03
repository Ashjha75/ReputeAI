package com.reputeai.server.reputeai.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic message response DTO for simple success/error messages.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponseDto {

    private Boolean success;

    private String message;

    public static MessageResponseDto success(String message) {
        return MessageResponseDto.builder()
                .success(true)
                .message(message)
                .build();
    }

    public static MessageResponseDto error(String message) {
        return MessageResponseDto.builder()
                .success(false)
                .message(message)
                .build();
    }
}

