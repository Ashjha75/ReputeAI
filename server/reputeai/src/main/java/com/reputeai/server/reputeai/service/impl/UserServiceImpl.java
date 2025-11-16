package com.reputeai.server.reputeai.service.impl;

import com.reputeai.server.reputeai.domain.dto.UserDto;
import com.reputeai.server.reputeai.domain.entity.Role;
import com.reputeai.server.reputeai.domain.entity.User;
import com.reputeai.server.reputeai.repository.RoleRepository;
import com.reputeai.server.reputeai.repository.UserRepository;
import com.reputeai.server.reputeai.service.UserService;
import com.reputeai.server.reputeai.util.ApplicationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationMapper mapper;

    /**
     * This is the core method for Spring Security. It loads a user by their email (username)
     * and aggregates all their roles and permissions into a list of authorities.
     * The result is cached for performance.
     */
    @Override
    @Cacheable(value = "userDetailsByEmail", key = "#email") // Caching the UserDetails object
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.info("Executing loadUserByUsername for {} - Cache was missed.", email);

        // 1. Fetch the user by email using our defined repository method.
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // 2. Get all authorities (roles AND permissions) using our corrected aggregation logic.
        Collection<? extends GrantedAuthority> authorities = getAuthorities(user.getRoles());
        log.info("Final authorities loaded for user {}: {}", email, authorities);

        // 3. Return a standard Spring Security User object, using the fields from our User entity.
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(), // This is user.getEmail()
                user.getPassword(), // This is user.getPasswordHash()
                user.isEnabled(),
                true, // isAccountNonExpired
                true, // isCredentialsNonExpired
                true, // isAccountNonLocked
                authorities
        );
    }

    /**
     * Aggregates all Roles and their unique Permissions into a single collection
     * of GrantedAuthority objects for Spring Security.
     * THIS IS THE CORRECTED LOGIC.
     */
    private Collection<? extends GrantedAuthority> getAuthorities(Set<Role> roles) {
        Set<GrantedAuthority> authorities = new HashSet<>();

        // 1. Add Roles as authorities (e.g., "ROLE_ADMIN")
        authorities.addAll(roles);

        // 2. Add all unique Permissions from those roles as authorities (e.g., "post:delete")
        // We use flatMap to correctly stream the Set<Permission> from each Role.
        Set<GrantedAuthority> permissions = roles.stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(permission -> new org.springframework.security.core.authority.SimpleGrantedAuthority(permission.getName()))
                .collect(Collectors.toSet());

        authorities.addAll(permissions);

        return authorities;
    }



    @Override
    @Transactional(readOnly = true)
    public UserDto findUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
        return mapper.toUserDto(user);
    }
}