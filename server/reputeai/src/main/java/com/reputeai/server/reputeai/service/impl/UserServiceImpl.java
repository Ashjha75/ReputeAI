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
import org.slf4j.MDC;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
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
    private final RoleRepository roleRepository;
    private final ApplicationMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.info("Executing loadUserByUsername for {}.", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        Collection<? extends GrantedAuthority> authorities = getAuthorities(user.getRoles());

        // debug-friendly log: authorities should be strings, not entity toString()
        log.info("Final authorities loaded for user {}: {}", email, authorities.stream()
                .map(GrantedAuthority::getAuthority).collect(Collectors.toList()));

        // Use the actual fields on your entity. Adjust if your entity uses different names.
        String username = user.getEmail(); // canonical username for spring security
        String passwordHash = user.getPasswordHash(); // ensure this matches your entity

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
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
        return mapper.toUserDto(user);
    }
}
