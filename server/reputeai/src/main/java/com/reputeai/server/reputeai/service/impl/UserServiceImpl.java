package com.reputeai.server.reputeai.service.impl;

import com.reputeai.server.reputeai.constants.MessageConstants;
import com.reputeai.server.reputeai.domain.dto.ChangePasswordRequestDto;
import com.reputeai.server.reputeai.domain.dto.UserDto;
import com.reputeai.server.reputeai.domain.dto.UserProfileDto;
import com.reputeai.server.reputeai.domain.entity.Role;
import com.reputeai.server.reputeai.domain.entity.User;
import com.reputeai.server.reputeai.exception.ApiException;
import com.reputeai.server.reputeai.exception.BadRequestException;
import com.reputeai.server.reputeai.exception.ErrorCode;
import com.reputeai.server.reputeai.repository.UserRepository;
import com.reputeai.server.reputeai.service.UserService;
import com.reputeai.server.reputeai.util.ApplicationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ApplicationMapper mapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.info(MessageConstants.LOG_LOADING_USER, email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(MessageConstants.ERROR_USER_NOT_FOUND + email));

        Collection<? extends GrantedAuthority> authorities = getAuthorities(user.getRoles());

        // debug-friendly log: authorities should be strings, not entity toString()
        log.info(MessageConstants.LOG_AUTHORITIES_LOADED, email, authorities.stream()
                .map(GrantedAuthority::getAuthority).collect(Collectors.toList()));

        // Use the actual fields on your entity. Adjust if your entity uses different names.
        String username = user.getEmail(); // canonical username for spring security
        String passwordHash = user.getPasswordHash(); // ensure this matches your entity
        if (passwordHash == null || passwordHash.isEmpty()) {
            // OAuth users don't have passwords
            // Use empty string as placeholder (Spring Security requires non-null)
            passwordHash = "";
        }
        return org.springframework.security.core.userdetails.User.withUsername(username)
                .password(passwordHash)
                .authorities(authorities)
                .accountExpired(false)
                .accountLocked(!user.isAccountNonLocked())   // adapt to your entity if different
                .credentialsExpired(false)
                .disabled(!user.isEnabled())                 // disabled = !enabled
                .build();
    }

    /**
     * Map Role and Permission entities to GrantedAuthority string values.
     * Roles and permissions are mapped to SimpleGrantedAuthority by name only.
     */
    private Collection<? extends GrantedAuthority> getAuthorities(Set<Role> roles) {
        // map role names
        Set<SimpleGrantedAuthority> roleAuthorities = roles.stream()
                .map(role -> new SimpleGrantedAuthority(role.getName()))
                .collect(Collectors.toSet());

        // map permissions (if role.getPermissions() returns Permission entities with getName())
        Set<SimpleGrantedAuthority> permissionAuthorities = roles.stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(permission -> new SimpleGrantedAuthority(permission.getName()))
                .collect(Collectors.toSet());

        roleAuthorities.addAll(permissionAuthorities);
        return roleAuthorities;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto findUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(MessageConstants.ERROR_USER_NOT_FOUND_BY_ID + id));
        return mapper.toUserDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileDto getUserProfile(String email) {
        log.info(MessageConstants.LOG_FETCHING_PROFILE, email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(MessageConstants.ERROR_USER_NOT_FOUND + email));

        UserProfileDto profile = new UserProfileDto();
        profile.setEmail(user.getEmail());
        profile.setFirstName(user.getFirstName());
        profile.setLastName(user.getLastName());

        // Compute full name
        String fullName = "";
        if (user.getFirstName() != null && !user.getFirstName().isBlank()) {
            fullName = user.getFirstName();
            if (user.getLastName() != null && !user.getLastName().isBlank()) {
                fullName += " " + user.getLastName();
            }
        } else if (user.getLastName() != null && !user.getLastName().isBlank()) {
            fullName = user.getLastName();
        }
        profile.setFullName(fullName.isBlank() ? null : fullName);

        // Set profile picture URL (will be null if not set)
        profile.setProfilePictureUrl(user.getProfilePictureUrl());

        profile.setCreatedAt(user.getCreatedAt());

        // Extract role names
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
        profile.setRoles(roleNames);

        // Extract permission names
        Set<String> permissionNames = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(permission -> permission.getName())
                .collect(Collectors.toSet());
        profile.setPermissions(permissionNames);

        log.info(MessageConstants.LOG_PROFILE_FETCHED, email);
        return profile;
    }

    @Override
    @Transactional
    public void changePassword(String userEmail, ChangePasswordRequestDto request) {
        log.info(MessageConstants.LOG_PASSWORD_CHANGE_ATTEMPT, userEmail);

        // 1. Validate that new password and confirmation match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            log.warn(MessageConstants.LOG_PASSWORD_MISMATCH, userEmail);
            throw new BadRequestException(MessageConstants.ERROR_PASSWORD_MISMATCH);
        }

        // 2. Validate that new password is different from current password
        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            log.warn(MessageConstants.LOG_PASSWORD_SAME, userEmail);
            throw new BadRequestException(MessageConstants.ERROR_PASSWORD_SAME_AS_CURRENT);
        }

        // 3. Find the user by email
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException(MessageConstants.ERROR_USER_NOT_FOUND + userEmail));

        // 4. Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            log.warn(MessageConstants.LOG_PASSWORD_INCORRECT, userEmail);
            throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND, MessageConstants.ERROR_CURRENT_PASSWORD_INCORRECT);
        }

        // 5. Update password with new hashed password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info(MessageConstants.LOG_PASSWORD_CHANGED, userEmail);
    }
}
