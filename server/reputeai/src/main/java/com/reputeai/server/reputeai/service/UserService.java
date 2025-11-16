package com.reputeai.server.reputeai.service;

import com.reputeai.server.reputeai.domain.dto.ChangePasswordRequestDto;
import com.reputeai.server.reputeai.domain.dto.UserDto;
import com.reputeai.server.reputeai.domain.dto.UserProfileDto;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

public interface UserService extends UserDetailsService {
    @Override
    UserDetails loadUserByUsername(String email) throws UsernameNotFoundException;

    UserDto findUserById(Long id);

    /**
     * Get user profile information by email.
     * Returns only safe, non-sensitive user data.
     *
     * @param email The email of the user (from JWT token)
     * @return UserProfileDto containing safe user information
     * @throws RuntimeException if user not found
     */
    UserProfileDto getUserProfile(String email);

    /**
     * Changes the password for the authenticated user.
     *
     * @param userEmail The email of the logged-in user (from JWT token)
     * @param request The password change request containing current and new passwords
     * @throws RuntimeException if current password is incorrect or new password validation fails
     */
    void changePassword(String userEmail, ChangePasswordRequestDto request);
}
