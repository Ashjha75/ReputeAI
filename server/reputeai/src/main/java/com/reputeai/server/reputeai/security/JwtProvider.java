package com.reputeai.server.reputeai.security;

import com.reputeai.server.reputeai.domain.entity.RefreshToken;
import com.reputeai.server.reputeai.domain.entity.User;
import com.reputeai.server.reputeai.repository.RefreshTokenRepository;
import com.reputeai.server.reputeai.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import javax.crypto.SecretKey;

@Component
@Slf4j
public class JwtProvider {

    private final PrivateKey privateKey; // nullable if HS256 fallback
    private final PublicKey publicKey;   // nullable if HS256 fallback
    private final SecretKey hmacKey;     // used when RSA not available
    private final long jwtExpirationMs;
    private final long refreshTokenDurationMs;
    private final boolean rsaMode;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final SecureRandom secureRandom;

    public JwtProvider(@Value("${jwt.private-key}") String privateKeyStr,
                       @Value("${jwt.public-key}") String publicKeyStr,
                       @Value("${jwt.expiration-ms}") long jwtExpirationMs,
                       @Value("${jwt.refresh-token.expiration-ms}") long refreshTokenDurationMs,
                       @Value("${app.jwtSecret:}") String hmacSecret,
                       RefreshTokenRepository refreshTokenRepository,
                       UserRepository userRepository) {
        PrivateKey pk = null;
        PublicKey pub = null;
        SecretKey hk = null;
        boolean useRsa = false;
        try {
            if (privateKeyStr != null && !privateKeyStr.isBlank() && publicKeyStr != null && !publicKeyStr.isBlank()) {
                byte[] privateBytes = Base64.getDecoder().decode(privateKeyStr.trim());
                byte[] publicBytes = Base64.getDecoder().decode(publicKeyStr.trim());
                KeyFactory keyFactory = KeyFactory.getInstance("RSA");
                pk = keyFactory.generatePrivate(new PKCS8EncodedKeySpec(privateBytes));
                pub = keyFactory.generatePublic(new X509EncodedKeySpec(publicBytes));
                useRsa = true;
                log.info("JWT Provider initialized in RSA mode ({} bits)", privateBytes.length * 8);
            } else {
                log.warn("RSA key strings are empty; falling back to HS256.");
            }
        } catch (Exception e) {
            log.warn("Failed to parse RSA keys, falling back to HS256: {}", e.getMessage());
        }
        if (!useRsa) {
            if (hmacSecret == null || hmacSecret.length() < 32) {
                // Generate ephemeral key via new builder API
                hk = Jwts.SIG.HS256.key().build();
                log.warn("Using generated ephemeral HS256 key; provide app.jwtSecret (>=32 chars) for stable tokens.");
            } else {
                hk = Keys.hmacShaKeyFor(padToMinLength(hmacSecret).getBytes());
                log.info("JWT Provider initialized in HS256 mode using app.jwtSecret");
            }
        }
        this.privateKey = pk;
        this.publicKey = pub;
        this.hmacKey = hk;
        this.jwtExpirationMs = jwtExpirationMs;
        this.refreshTokenDurationMs = refreshTokenDurationMs;
        this.rsaMode = useRsa;
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.secureRandom = new SecureRandom();
    }

    private String padToMinLength(String secret) {
        // Ensure minimum length for HS256 (>=32 bytes) by repeating if needed
        StringBuilder sb = new StringBuilder(secret);
        while (sb.length() < 48) { // slightly more than 32 for safety
            sb.append(secret);
        }
        return sb.substring(0, 64); // cap length
    }

    /**
     * Generates a JWT access token from an Authentication object.
     * Includes username, roles, and permissions as claims.
     */
    public String generateAccessToken(Authentication authentication) {
        String username = authentication.getName();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        // Extract roles and permissions to include in the token
        List<String> authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        var builder = Jwts.builder()
                .subject(username)
                .claim("auth", authorities) // Add roles and permissions
                .issuedAt(now)
                .expiration(expiryDate);

        if (rsaMode) {
            return builder.signWith(privateKey, Jwts.SIG.RS256).compact();
        } else {
            return builder.signWith(hmacKey, Jwts.SIG.HS256).compact();
        }
    }

    /**
     * Extracts the username (email) from a validated JWT.
     */
    public String getUsernameFromJwt(String token) {
        Claims claims = parse(token);
        return claims.getSubject();
    }

    /**
     * Validates the JWT's signature and expiration.
     */
    public boolean validateToken(String token) {
        try {
            parse(token);
            return true;
        } catch (Exception e) {
            log.error("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    private Claims parse(String token) {
        if (rsaMode) {
            return Jwts.parser().verifyWith(publicKey).build().parseSignedClaims(token).getPayload();
        } else {
            return Jwts.parser().verifyWith(hmacKey).build().parseSignedClaims(token).getPayload();
        }
    }

    // ========== Refresh Token Methods ==========

    /**
     * Generates a cryptographically secure random token string.
     * Uses 32 bytes (256 bits) of random data encoded as base64.
     *
     * @return A secure random token string
     */
    private String generateSecureToken() {
        byte[] randomBytes = new byte[32]; // 256 bits
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    /**
     * Creates a new refresh token for the given user.
     * Deletes any existing refresh token for the user before creating a new one.
     * Uses cryptographically secure random token generation.
     *
     * @param userId The ID of the user
     * @return The created RefreshToken entity
     * @throws RuntimeException if user not found
     */
    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // Find and delete existing refresh token for this user
        refreshTokenRepository.findByUser(user).ifPresent(existingToken -> {
            refreshTokenRepository.delete(existingToken);
            refreshTokenRepository.flush(); // Force delete to complete before insert
        });

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .expiryDate(Instant.now().plusMillis(refreshTokenDurationMs))
                .token(generateSecureToken())
                .build();

        RefreshToken saved = refreshTokenRepository.save(refreshToken);
        log.info("Created refresh token for user ID: {}", userId);
        return saved;
    }

    /**
     * Verifies that the refresh token has not expired.
     * If expired, deletes the token and throws an exception.
     *
     * @param token The RefreshToken entity to verify
     * @return The same token if valid
     * @throws RuntimeException if the token is expired
     */
    @Transactional
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            log.warn("Refresh token expired for user ID: {}", token.getUser().getId());
            throw new RuntimeException("Refresh token was expired. Please make a new signin request.");
        }
        return token;
    }

    /**
     * Finds a refresh token by its token string.
     *
     * @param tokenString The token string to search for
     * @return The RefreshToken entity if found
     * @throws RuntimeException if token not found
     */
    public RefreshToken findByToken(String tokenString) {
        return refreshTokenRepository.findByToken(tokenString)
                .orElseThrow(() -> new RuntimeException("Refresh token not found: " + tokenString));
    }

    /**
     * Deletes a refresh token (for logout functionality).
     *
     * @param tokenString The refresh token string to delete
     */
    @Transactional
    public void deleteRefreshToken(String tokenString) {
        refreshTokenRepository.findByToken(tokenString).ifPresent(token -> {
            refreshTokenRepository.delete(token);
            log.info("Deleted refresh token for user ID: {}", token.getUser().getId());
        });
    }

    /**
     * Deletes all refresh tokens for a user (for logout from all devices).
     *
     * @param userId The user ID
     */
    @Transactional
    public void deleteAllRefreshTokensForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        refreshTokenRepository.deleteByUser(user);
        log.info("Deleted all refresh tokens for user ID: {}", userId);
    }

    /**
     * Validates and refreshes an access token using a refresh token.
     * Returns a new access token if the refresh token is valid.
     *
     * @param refreshTokenString The refresh token string
     * @return A new access token
     * @throws RuntimeException if refresh token is invalid or expired
     */
    @Transactional
    public String refreshAccessToken(String refreshTokenString) {
        RefreshToken refreshToken = findByToken(refreshTokenString);
        verifyExpiration(refreshToken);

        User user = refreshToken.getUser();

        // Generate new access token
        // Create a minimal Authentication object for token generation
        List<String> authorities = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(permission -> permission.getName())
                .distinct()
                .toList();

        // Add role names as well
        List<String> roles = user.getRoles().stream()
                .map(role -> "ROLE_" + role.getName())
                .toList();

        List<String> allAuthorities = new java.util.ArrayList<>(authorities);
        allAuthorities.addAll(roles);

        // Create Authentication object for token generation
        Authentication auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                user.getEmail(),
                null,
                allAuthorities.stream()
                        .map(org.springframework.security.core.authority.SimpleGrantedAuthority::new)
                        .collect(java.util.stream.Collectors.toList())
        );

        String newAccessToken = generateAccessToken(auth);
        log.info("Refreshed access token for user ID: {}", user.getId());

        return newAccessToken;
    }
}
