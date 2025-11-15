package com.reputeai.server.reputeai.service;

import com.reputeai.server.reputeai.domain.dto.RegisterRequestDto;
import com.reputeai.server.reputeai.domain.dto.UserDto;
import com.reputeai.server.reputeai.domain.entity.User;
import org.springframework.security.core.userdetails.UserDetailsService;

/**
 * Service interface for managing users.
 * Extends Spring Security's UserDetailsService to integrate with the authentication process.
 */
public interface UserService extends UserDetailsService {

    /**
     * Registers a new user in the system.
     *
     * @param registerRequestDto DTO containing user registration details.
     * @return The newly created User entity.
     */
    User registerNewUser(RegisterRequestDto registerRequestDto);

    /**
     * Finds a user by their unique ID.
     *
     * @param id The ID of the user.
     * @return A DTO representing the user.
     */
    UserDto findUserById(Long id);

    // Add other user management methods here:
    // UserDto updateUserProfile(Long id, UpdateProfileDto dto);
    // void deactivateUser(Long id);
}