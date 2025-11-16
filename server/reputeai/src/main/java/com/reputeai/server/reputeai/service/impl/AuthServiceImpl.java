package com.reputeai.server.reputeai.service.impl;

import com.reputeai.server.reputeai.constants.MessageConstants;
import com.reputeai.server.reputeai.domain.dto.LoginRequestDto;
import com.reputeai.server.reputeai.domain.dto.LoginResponseDto;
import com.reputeai.server.reputeai.domain.dto.RegisterRequestDto;
import com.reputeai.server.reputeai.domain.dto.RegisterResponseDto;
import com.reputeai.server.reputeai.domain.entity.Role;
import com.reputeai.server.reputeai.domain.entity.User;
import com.reputeai.server.reputeai.exception.ApiException;
import com.reputeai.server.reputeai.exception.ConflictException;
import com.reputeai.server.reputeai.exception.ErrorCode;
import com.reputeai.server.reputeai.repository.RoleRepository;
import com.reputeai.server.reputeai.repository.UserRepository;
import com.reputeai.server.reputeai.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
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

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public RegisterResponseDto register(RegisterRequestDto registerRequestDto) {
        final String email = registerRequestDto.getEmail() == null ? null : registerRequestDto.getEmail().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email already in use");
        }

        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RuntimeException("Error: Default 'USER' role not found in database."));

        User newUser = User.builder()
                .firstName(registerRequestDto.getFirstName() == null ? null : registerRequestDto.getFirstName().trim())
                .lastName(registerRequestDto.getLastName() == null ? null : registerRequestDto.getLastName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(registerRequestDto.getPassword()))
                .isEnabled(false) // disabled until verification
                .roles(Set.of(userRole))
                .build();

        try {
            userRepository.save(newUser);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Email already in use", e);
        }

        log.info("User registered: id={}", newUser.getId());
        return new RegisterResponseDto(true, "Registration successful. Please check your email to verify your account.");
    }


    @Override
    public ResponseEntity<LoginResponseDto> login(LoginRequestDto loginRequestDto) {

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequestDto.getEmail(), loginRequestDto.getPassword())
            );
        } catch (DisabledException ex) {
            // account disabled -> 403
            log.warn("Authentication failed: account disabled for email={}", loginRequestDto.getEmail());
            throw new ApiException(ErrorCode.FORBIDDEN, MessageConstants.ERROR_ACCOUNT_DISABLED);
        } catch (BadCredentialsException | UsernameNotFoundException ex) {
            // invalid credentials -> 401
            log.warn("Authentication failed: invalid credentials for email={}", loginRequestDto.getEmail());
            throw new ApiException(ErrorCode.UNAUTHENTICATED, MessageConstants.ERROR_BAD_CREDENTIALS);
        } catch (InternalAuthenticationServiceException ex) {
            // internal auth backend problem -> 500
            log.error("Authentication service error for email={}: {}", loginRequestDto.getEmail(), ex.getMessage(), ex);
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "Authentication backend error");
        } catch (AuthenticationException ex) {
            // generic authentication failure -> 401 (defensive)
            log.warn("Authentication failed for email={} : {}", loginRequestDto.getEmail(), ex.getClass().getSimpleName());
            throw new ApiException(ErrorCode.UNAUTHENTICATED, MessageConstants.ERROR_BAD_CREDENTIALS);
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // load user from DB for profile/claims
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException(MessageConstants.ERROR_USER_NOT_FOUND + authentication.getName()));

        // Extra checks — these are defensive. Disabled accounts normally fail during authenticate() above.
//        if (!user.isEnabled()) {
//            throw new ApiException(ErrorCode.FORBIDDEN, MessageConstants.ERROR_ACCOUNT_DISABLED);
//        }
//        if (!user.isEmailVerified()) {
//            throw new ApiException(ErrorCode.BAD_REQUEST, MessageConstants.ERROR_EMAIL_NOT_VERIFIED);
//        }

        // put user_id into MDC so subsequent logs include it
        if (user.getId() != null) {
            MDC.put("user_id", String.valueOf(user.getId()));
        }

        try {
            // Replace with real JWT generation when available
            String accessToken = "access-" + user.getId() + "-" + System.currentTimeMillis();
            String refreshToken = "refresh-" + user.getId() + "-" + System.currentTimeMillis();

            LoginResponseDto response = new LoginResponseDto(
                    accessToken,
                    refreshToken,
                    user.getId(),
                    user.getEmail(),
                    user.getRoles().stream().map(Role::getName).collect(Collectors.toSet())
            );
            return ResponseEntity.ok(response);
        } finally {
            // ensure MDC cleaned up after request processing
            if (user.getId() != null) {
                MDC.remove("user_id");
            }
        }
    }
}
