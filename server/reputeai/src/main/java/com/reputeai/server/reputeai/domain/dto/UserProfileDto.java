package com.reputeai.server.reputeai.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;

/**
 * DTO for user profile information.
 * Contains only safe, non-sensitive user data for displaying in UI.
 * Excludes: passwordHash, account status flags, internal IDs.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {

    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private Instant createdAt;
    private Set<String> roles;
    private Set<String> permissions;
}

