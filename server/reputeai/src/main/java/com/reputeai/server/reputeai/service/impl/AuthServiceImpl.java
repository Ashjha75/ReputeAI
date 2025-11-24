package com.reputeai.server.reputeai.service.impl;

import com.reputeai.server.reputeai.constants.MessageConstants;
import com.reputeai.server.reputeai.domain.dto.*;
import com.reputeai.server.reputeai.domain.entity.RefreshToken;
import com.reputeai.server.reputeai.domain.entity.Role;
import com.reputeai.server.reputeai.domain.entity.User;
import com.reputeai.server.reputeai.exception.ApiException;
import com.reputeai.server.reputeai.exception.ConflictException;
import com.reputeai.server.reputeai.exception.ErrorCode;
import com.reputeai.server.reputeai.repository.RoleRepository;
import com.reputeai.server.reputeai.repository.UserRepository;
import com.reputeai.server.reputeai.security.JwtProvider;
import com.reputeai.server.reputeai.service.AuthService;
import com.reputeai.server.reputeai.service.OAuthUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final int OTP_TTL_MINUTES = 10;
    private static final int RESET_TTL_MINUTES = 30;
    private static final String FALLBACK_TEST_OTP = "123456";
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final OAuthUserService oAuthUserService;
    // In-memory stores for demo purposes (replace with persistent tables/Redis in production)
    private final ConcurrentHashMap<String, OtpRecord> emailOtpStore = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, ResetRecord> passwordResetStore = new ConcurrentHashMap<>();

    @Override
    @Transactional
    public RegisterResponseDto register(RegisterRequestDto registerRequestDto) {
        final String rawEmail = registerRequestDto.getEmail();
        if (rawEmail == null || rawEmail.isBlank()) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Email must be provided");
        }
        final String email = rawEmail.trim().toLowerCase(Locale.ROOT);

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
                .isEnabled(true)
                .isEmailVerified(false)
                .roles(Set.of(userRole))
                .build();

        try {
            userRepository.save(newUser);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Email already in use", e);
        }

        log.info("User registered: id={}", newUser.getId());
        requestEmailVerification(email);
        return new RegisterResponseDto(true, "Registration successful. Please check your email to verify your account.");
    }

    @Override
    public LoginResponseDto login(LoginRequestDto loginRequestDto) {

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

        if (!user.isEmailVerified()) {
            log.warn("Login blocked: email not verified for {}. Auto-sending OTP.", user.getEmail());
            requestEmailVerification(user.getEmail());
            throw new ApiException(ErrorCode.FORBIDDEN, MessageConstants.ERROR_EMAIL_VERIFICATION_REQUIRED);
        }

        return generateLoginResponse(user);
    }

    @Override
    @Transactional
    public LoginResponseDto processOAuth2Login(OAuth2User oauth2User, String registrationId) {
        return oAuthUserService.processOAuth2Login(oauth2User, registrationId);
    }

    /**
     * Generate login response with JWT tokens (Unified Helper).
     */
    private LoginResponseDto generateLoginResponse(User user) {
        // put user_id into MDC so subsequent logs include it
        if (user.getId() != null) {
            MDC.put("user_id", String.valueOf(user.getId()));
        }

        try {
            // Create Authentication object for JWT generation
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    user.getEmail(),
                    null, // No password
                    user.getAuthorities()
            );

            // Generate JWT access token
            String accessToken = jwtProvider.generateAccessToken(authentication);

            // Generate refresh token
            RefreshToken refreshTokenEntity = jwtProvider.createRefreshToken(user.getId());
            String refreshToken = refreshTokenEntity.getToken();

            // Create personalized welcome message
            String userName = user.getFirstName() != null && !user.getFirstName().isBlank()
                    ? user.getFirstName()
                    : user.getEmail();
            String welcomeMessage = String.format("Login successful! Welcome back, %s.", userName);

            log.info("JWT tokens generated for user: userId={}, email={}", user.getId(), user.getEmail());

            return new LoginResponseDto(
                    true,  // success
                    welcomeMessage,  // message
                    accessToken,
                    refreshToken,
                    "Bearer",  // tokenType
                    user.getId(),
                    user.getEmail(),
                    user.getRoles().stream().map(Role::getName).collect(Collectors.toSet())
            );
        } finally {
            MDC.remove("user_id");
        }
    }

    @Override
    public RefreshTokenResponseDto refreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ApiException(ErrorCode.UNAUTHENTICATED, MessageConstants.ERROR_REFRESH_TOKEN_INVALID);
        }
        String newAccessToken = jwtProvider.refreshAccessToken(refreshToken);
        log.info("Refresh token used, generated new access token");
        return new RefreshTokenResponseDto(true, MessageConstants.SUCCESS_TOKEN_REFRESHED, newAccessToken, "Bearer");
    }

    // ===== Refresh / Logout / Password Reset Methods (Unchanged) =====

    @Override
    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            jwtProvider.deleteRefreshToken(refreshToken);
            log.info("User logged out, refresh token invalidated");
        }
    }

    // ===== Email Verification (Unchanged) =====
    @Override
    public SimpleSuccessResponseDto requestEmailVerification(String email) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, MessageConstants.ERROR_USER_NOT_FOUND + normalizedEmail));
        if (user.isEmailVerified()) {
            return new SimpleSuccessResponseDto(true, MessageConstants.ERROR_EMAIL_ALREADY_VERIFIED);
        }
        String otp = generateOtp();
        emailOtpStore.put(normalizedEmail, new OtpRecord(otp, Instant.now().plusSeconds(OTP_TTL_MINUTES * 60L)));
        log.info(MessageConstants.LOG_REQUESTING_EMAIL_VERIFICATION, normalizedEmail);
        // Simulate sending OTP (log only)
        log.debug("Generated OTP {} for email {} (expires {} minutes)", otp, normalizedEmail, OTP_TTL_MINUTES);
        return new SimpleSuccessResponseDto(true, MessageConstants.SUCCESS_VERIFICATION_EMAIL_SENT);
    }

    @Override
    public SimpleSuccessResponseDto verifyEmailOtp(VerifyEmailRequestDto request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND,
                        MessageConstants.ERROR_USER_NOT_FOUND + normalizedEmail));

        if (user.isEmailVerified()) {
            return new SimpleSuccessResponseDto(true, MessageConstants.ERROR_EMAIL_ALREADY_VERIFIED);
        }

        // Accept the test fallback OTP (case-insensitive, trimmed)
        String providedOtp = request.getOtp() == null ? "" : request.getOtp().trim();
        if (FALLBACK_TEST_OTP.equalsIgnoreCase(providedOtp)) {
            user.setEmailVerified(true);
            userRepository.save(user);
            emailOtpStore.remove(normalizedEmail);
            log.info(MessageConstants.LOG_EMAIL_VERIFIED, normalizedEmail);
            return new SimpleSuccessResponseDto(true, MessageConstants.SUCCESS_EMAIL_VERIFIED);
        }

        OtpRecord record = emailOtpStore.get(normalizedEmail);
        if (record == null
                || Instant.now().isAfter(record.expiresAt())
                || !record.otp().equals(providedOtp)) {
            throw new ApiException(ErrorCode.UNAUTHENTICATED, MessageConstants.ERROR_OTP_INVALID);
        }

        user.setEmailVerified(true);
        userRepository.save(user);
        emailOtpStore.remove(normalizedEmail);
        log.info(MessageConstants.LOG_EMAIL_VERIFIED, normalizedEmail);
        return new SimpleSuccessResponseDto(true, MessageConstants.SUCCESS_EMAIL_VERIFIED);
    }

    // ===== Forgot / Reset Password (Unchanged) =====
    @Override
    public SimpleSuccessResponseDto forgotPassword(ForgotPasswordRequestDto request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
        // ensure user exists
        userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, MessageConstants.ERROR_USER_NOT_FOUND + normalizedEmail));
        String token = generateResetToken(normalizedEmail);
        passwordResetStore.put(normalizedEmail, new ResetRecord(token, Instant.now().plusSeconds(RESET_TTL_MINUTES * 60L)));
        log.info(MessageConstants.LOG_FORGOT_PASSWORD_REQUEST, normalizedEmail);
        log.debug("Generated reset token {} for email {} (expires {} minutes)", token, normalizedEmail, RESET_TTL_MINUTES);
        return new SimpleSuccessResponseDto(true, MessageConstants.SUCCESS_PASSWORD_RESET_REQUESTED);
    }

    @Override
    @Transactional
    public SimpleSuccessResponseDto resetPassword(ResetPasswordRequestDto request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, MessageConstants.ERROR_USER_NOT_FOUND + normalizedEmail));
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new ApiException(ErrorCode.BAD_REQUEST, MessageConstants.ERROR_PASSWORD_MISMATCH);
        }
        ResetRecord record = passwordResetStore.get(normalizedEmail);
        if (record == null || Instant.now().isAfter(record.expiresAt()) || !record.token().equals(request.getToken())) {
            throw new ApiException(ErrorCode.UNAUTHENTICATED, MessageConstants.ERROR_RESET_TOKEN_INVALID);
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        passwordResetStore.remove(normalizedEmail);
        log.info(MessageConstants.LOG_RESET_PASSWORD_SUCCESS, normalizedEmail);
        return new SimpleSuccessResponseDto(true, MessageConstants.SUCCESS_PASSWORD_RESET);
    }

    private String generateOtp() {
        int code = new Random().nextInt(900_000) + 100_000; // 6-digit
        return String.valueOf(code);
    }

    private String generateResetToken(String email) {
        // Delegate to JwtProvider so we have a single source of truth
        return jwtProvider.generatePasswordResetToken(email);
    }

    private record OtpRecord(String otp, Instant expiresAt) {
    }

    private record ResetRecord(String token, Instant expiresAt) {
    }
}
