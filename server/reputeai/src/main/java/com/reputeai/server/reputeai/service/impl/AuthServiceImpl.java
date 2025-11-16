package com.reputeai.server.reputeai.service.impl;

import com.reputeai.server.reputeai.constants.MessageConstants;
import com.reputeai.server.reputeai.domain.dto.LoginRequestDto;
import com.reputeai.server.reputeai.domain.dto.LoginResponseDto;
import com.reputeai.server.reputeai.domain.dto.RegisterRequestDto;
import com.reputeai.server.reputeai.domain.dto.RegisterResponseDto;
import com.reputeai.server.reputeai.domain.entity.Role;
import com.reputeai.server.reputeai.domain.entity.User;
import com.reputeai.server.reputeai.exception.ConflictException;
import com.reputeai.server.reputeai.repository.RoleRepository;
import com.reputeai.server.reputeai.repository.UserRepository;
import com.reputeai.server.reputeai.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationConfiguration authenticationConfiguration;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    private AuthenticationManager authenticationManager() throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Override
    @Transactional
    public RegisterResponseDto register(RegisterRequestDto registerRequestDto) {
        final String email = registerRequestDto.getEmail() == null ? null : registerRequestDto.getEmail().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email already in use");
        }

        // Resolve default role
        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RuntimeException("Error: Default 'USER' role not found in database."));

        // Build entity
        User newUser = User.builder()
                .firstName(registerRequestDto.getFirstName() == null ? null : registerRequestDto.getFirstName().trim())
                .lastName(registerRequestDto.getLastName() == null ? null : registerRequestDto.getLastName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(registerRequestDto.getPassword()))
                .isEnabled(false) // Keep disabled until email verification completes
                .roles(Set.of(userRole))
                .build();

        try {
            userRepository.save(newUser);
        } catch (DataIntegrityViolationException e) {
            // Handle race condition with unique constraint at DB level
            throw new ConflictException("Email already in use", e);
        }

        // Avoid logging PII; log only the id
        log.info("User registered: id={}", newUser.getId());
        // TODO: trigger verification email asynchronously (outbox or event)
        return new RegisterResponseDto(true, "Registration successful. Please check your email to verify your account.");
    }


    @Override
    public LoginResponseDto login(LoginRequestDto loginRequestDto) {
        Authentication authentication;
        try {
            AuthenticationManager authManager = authenticationConfiguration.getAuthenticationManager();
            authentication = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequestDto.getEmail(), loginRequestDto.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException(MessageConstants.ERROR_BAD_CREDENTIALS);
        } catch (Exception e) {
            throw new RuntimeException("Authentication failed", e);
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException(MessageConstants.ERROR_USER_NOT_FOUND + authentication.getName()));

        if (!user.isEnabled()) {
            throw new RuntimeException(MessageConstants.ERROR_ACCOUNT_DISABLED);
        }
        if (!user.isEmailVerified()) {
            throw new RuntimeException(MessageConstants.ERROR_EMAIL_NOT_VERIFIED);
        }

        // Temporary token generation placeholders until JWT / refresh services are available
        String accessToken = "access-" + user.getId() + "-" + System.currentTimeMillis();
        String refreshToken = "refresh-" + user.getId() + "-" + System.currentTimeMillis();

        return new LoginResponseDto(
                accessToken,
                refreshToken,
                user.getId(),
                user.getEmail(),
                user.getRoles().stream().map(Role::getName).collect(Collectors.toSet())
        );
    }

    @Override
    public LoginResponseDto refreshToken(String refreshToken) {
        throw new UnsupportedOperationException("Refresh token logic not yet implemented.");
    }
}