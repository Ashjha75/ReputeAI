package com.reputeai.server.reputeai.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
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
    private final boolean rsaMode;

    public JwtProvider(@Value("${jwt.private-key}") String privateKeyStr,
                       @Value("${jwt.public-key}") String publicKeyStr,
                       @Value("${jwt.expiration-ms}") long jwtExpirationMs,
                       @Value("${app.jwtSecret:}") String hmacSecret) {
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
        this.rsaMode = useRsa;
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
}
