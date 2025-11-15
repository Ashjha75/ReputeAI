package com.reputeai.server.reputeai.service.impl;

import com.reputeai.server.reputeai.domain.dto.RegisterRequestDto;
import com.reputeai.server.reputeai.domain.dto.UserDto;
import com.reputeai.server.reputeai.domain.entity.Role;
import com.reputeai.server.reputeai.domain.entity.User;
import com.reputeai.server.reputeai.repository.UserRepository;
import com.reputeai.server.reputeai.service.UserService;
import com.reputeai.server.reputeai.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final Mapper mapper;
// In com.reputeai.security.SecurityConfig.java

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Strength 12 is a very strong and recommended default.
        return new BCryptPasswordEncoder(12);
    }
    /**
     * Implements the core method for Spring Security to find a user.
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .map(user -> new org.springframework.security.core.userdetails.User(
                        user.getUsername(),
                        user.getPassword(),
                        user.isEnabled(),
                        user.isAccountNonExpired(),
                        user.isCredentialsNonExpired(),
                        user.isAccountNonLocked(),
                        getAuthorities(user.getRoles()) // Aggregates roles and permissions
                ))
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    @Override
    @Transactional
    public User registerNewUser(RegisterRequestDto registerRequestDto) {
        if (userRepository.existsByEmail(registerRequestDto.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }
        
        User newUser = User.builder()
                .firstName(registerRequestDto.getFirstName())
                .lastName(registerRequestDto.getLastName())
                .email(registerRequestDto.getEmail())
                .passwordHash(passwordEncoder.encode(registerRequestDto.getPassword()))
                // Assign default 'USER' role
                .build();
        
        return userRepository.save(newUser);
    }
    
    @Override
    @Transactional(readOnly = true)
    public UserDto findUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapper.toUserDto(user);
    }

    /**
     * Aggregates all Roles and their unique Permissions into a single collection
     * of GrantedAuthority objects for Spring Security.
     */
    private Collection<? extends GrantedAuthority> getAuthorities(Set<Role> roles) {
        Set<GrantedAuthority> authorities = new HashSet<>(roles); // Adds "ROLE_ADMIN", etc.

        Set<GrantedAuthority> permissions = roles.stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(permission -> new SimpleGrantedAuthority(permission.getName()))
                .collect(Collectors.toSet());
        
        authorities.addAll(permissions); // Adds "post:delete", etc.
        
        return authorities;
    }
}