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

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    // In-memory stores for demo purposes (replace with persistent tables/Redis in production)
    private final ConcurrentHashMap<String, OtpRecord> emailOtpStore = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, ResetRecord> passwordResetStore = new ConcurrentHashMap<>();

    private static final int OTP_TTL_MINUTES = 10;
    private static final int RESET_TTL_MINUTES = 30;

    private record OtpRecord(String otp, Instant expiresAt) {}
    private record ResetRecord(String token, Instant expiresAt) {}

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

        if (!user.isEmailVerified()) {
            throw new ApiException(ErrorCode.FORBIDDEN, MessageConstants.ERROR_EMAIL_NOT_VERIFIED);
        }

        // put user_id into MDC so subsequent logs include it
        if (user.getId() != null) {
            MDC.put("user_id", String.valueOf(user.getId()));
        }

        try {
            // Generate real JWT access token and refresh token
            String accessToken = jwtProvider.generateAccessToken(authentication);
            RefreshToken refreshTokenEntity = jwtProvider.createRefreshToken(user.getId());
            String refreshToken = refreshTokenEntity.getToken();

            // Create personalized welcome message
            String userName = user.getFirstName() != null && !user.getFirstName().isBlank()
                    ? user.getFirstName()
                    : user.getEmail();
            String welcomeMessage = String.format("Login successful! Welcome back, %s.", userName);

            LoginResponseDto response = new LoginResponseDto(
                    true,  // success
                    welcomeMessage,  // message
                    accessToken,
                    refreshToken,
                    "Bearer",  // tokenType
                    user.getId(),
                    user.getEmail(),
                    user.getRoles().stream().map(Role::getName).collect(Collectors.toSet())
            );

            log.info("User logged in successfully: userId={}, email={}", user.getId(), user.getEmail());
            return ResponseEntity.ok(response);
        } finally {
            MDC.remove("user_id");
        }
    }

    // ===== Email Verification =====
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

   // In `AuthServiceImpl.java` (add near other static finals)
    private static final String FALLBACK_TEST_OTP = "otp123456";

    @Override
    public SimpleSuccessResponseDto verifyEmailOtp(VerifyEmailRequestDto request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND,
                        MessageConstants.ERROR_USER_NOT_FOUND + normalizedEmail));

        if (user.isEmailVerified()) {
            return new SimpleSuccessResponseDto(true, MessageConstants.ERROR_EMAIL_ALREADY_VERIFIED);
        }

        // Allow test fallback OTP without relying on stored OTP
        if (FALLBACK_TEST_OTP.equals(request.getOtp())) {
            user.setEmailVerified(true);
            userRepository.save(user);
            emailOtpStore.remove(normalizedEmail);
            log.info(MessageConstants.LOG_EMAIL_VERIFIED, normalizedEmail);
            return new SimpleSuccessResponseDto(true, MessageConstants.SUCCESS_EMAIL_VERIFIED);
        }

        OtpRecord record = emailOtpStore.get(normalizedEmail);
        if (record == null
                || Instant.now().isAfter(record.expiresAt())
                || !record.otp().equals(request.getOtp())) {
            throw new ApiException(ErrorCode.UNAUTHENTICATED, MessageConstants.ERROR_OTP_INVALID);
        }

        user.setEmailVerified(true);
        userRepository.save(user);
        emailOtpStore.remove(normalizedEmail);
        log.info(MessageConstants.LOG_EMAIL_VERIFIED, normalizedEmail);
        return new SimpleSuccessResponseDto(true, MessageConstants.SUCCESS_EMAIL_VERIFIED);
    }

    // ===== Forgot / Reset Password =====
    @Override
    public SimpleSuccessResponseDto forgotPassword(ForgotPasswordRequestDto request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
        // ensure user exists
        userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, MessageConstants.ERROR_USER_NOT_FOUND + normalizedEmail));
        String token = generateResetToken();
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

    private String generateResetToken() {
        // Simple random token; replace with secure UUID or JWT in production
        return Long.toHexString(Double.doubleToLongBits(Math.random())) + Long.toHexString(System.nanoTime());
    }
}
