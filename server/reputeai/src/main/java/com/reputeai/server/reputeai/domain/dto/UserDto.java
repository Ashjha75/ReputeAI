package com.reputeai.server.reputeai.domain.dto;

import lombok.Data;

import java.time.Instant;
import java.util.Set;

@Data
public class UserDto {
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private boolean isEnabled;
    private Instant createdAt;
    private Set<String> roles;
}