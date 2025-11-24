# Spring Security: Production-Grade 2-Day Implementation

**Complete syllabus with explanations - Nothing removed**

----------

## **1. Basics to know (read once — no fluff)**

### 1.1 Authentication vs Authorization

- **Authentication**: Verifying identity (login process)
- **Authorization**: Checking permissions after login
- **Why matters**: Authentication happens first in filter chain, authorization checks happen at endpoint/method level

### 1.2 Principal / GrantedAuthority / Authentication / SecurityContextHolder

- **Principal**: The logged-in user (usually UserDetails object)
- **GrantedAuthority**: Single permission/role (e.g., ROLE_ADMIN, READ_PRIVILEGE)
- **Authentication**: Contains principal + authorities + credentials
- **SecurityContextHolder**: ThreadLocal storage holding Authentication for current request
- **Flow**: Request → Filter extracts credentials → Creates Authentication → Stores in SecurityContextHolder →
  Controller accesses it

### 1.3 Stateful (session/cookie) vs Stateless (Bearer JWT) tradeoffs

**Stateful (Session + Cookie):**

- Server stores session data (memory/Redis)
- JSESSIONID cookie sent automatically
- Easy immediate logout (delete session)
- Harder horizontal scaling (session stickiness needed)

**Stateless (JWT Bearer Token):**

- No server-side session storage
- Client sends token in Authorization header each request
- Easy horizontal scaling
- Harder immediate revocation (need blacklist or short TTL)
- **Use when**: Building APIs for mobile/SPA, microservices

### 1.4 CORS basics

- **What**: Browser security preventing frontend (localhost:3000) from calling API (localhost:8080)
- **allowed-origins**: Which domains can call your API
- **allow-credentials=false for token-based APIs**: When using Bearer tokens, set this false (credentials are cookies)
- **preflight headers**: Browser sends OPTIONS request first to check if POST/PUT allowed
- **Why matters**: Without CORS config, your React/Angular app can't call backend

### 1.5 CSRF basics

- **What**: Cross-Site Request Forgery - attacker tricks user's browser into making unwanted request
- **required for cookie/session**: If using JSESSIONID cookies, attacker can piggyback on it
- **disable for pure stateless APIs**: If using only Bearer tokens (no cookies), CSRF not possible
- **When to enable**: Session-based auth with cookies
- **When to disable**: Stateless JWT APIs

----------

## **2. Project & deps (minimal, exact)**

### 2.1 Spring Boot (latest stable) + Spring Security 6

- Use Spring Boot 3.x (requires Java 17+)
- Spring Security 6 uses lambda DSL (no `.and()` chaining)

### 2.2 Maven/Gradle dependencies

```xml
<!-- Core -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
<groupId>org.springframework.boot</groupId>
<artifactId>spring-boot-starter-web</artifactId>
</dependency>

        <!-- JWT -->
<dependency>
<groupId>org.springframework.security</groupId>
<artifactId>spring-security-oauth2-resource-server</artifactId>
</dependency>
<dependency>
<groupId>org.springframework.security</groupId>
<artifactId>spring-security-oauth2-jose</artifactId>
</dependency>
        <!-- Alternative: Nimbus JOSE JWT -->
<dependency>
<groupId>com.nimbusds</groupId>
<artifactId>nimbus-jose-jwt</artifactId>
<version>9.37.3</version>
</dependency>

```

**Why these specific deps:**

- `oauth2-resource-server` + `oauth2-jose`: Spring's native JWT support, handles validation automatically
- `nimbus-jose-jwt`: Industry standard library, more control over JWT operations

### 2.3 Profiles: application.yml, application-prod.yml

```yaml
# application.yml (dev)
spring:
  security:
    jwt:
      secret-key: dev-secret-key-at-least-256-bits-long
      expiration: 900000 # 15 min in ms

# application-prod.yml
spring:
  security:
    jwt:
      secret-key: ${JWT_SECRET_KEY} # from env/Vault
      expiration: ${JWT_EXPIRATION:900000}

```

**Why profiles**: Secrets never in repo, env-specific configs separated

### 2.4 Build checks: dependency-scan

```xml
<!-- OWASP Dependency Check Plugin -->
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <configuration>
        <failBuildOnCVSS>7</failBuildOnCVSS>
    </configuration>
</plugin>

```

**Why**: Automated detection of vulnerable dependencies before deployment

----------

## **3. Password & credentials (implement immediately)**

### 3.1 PasswordEncoder bean — BCrypt with strength 12 or Argon2

```java

@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12); // strength 12 = 2^12 iterations
}

// Alternative: Argon2 (OWASP recommended)
@Bean
public PasswordEncoder passwordEncoder() {
    return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
}

```

**Why BCrypt strength 12**:

- 10 = ~0.1s per hash (too fast for 2024 hardware)
- 12 = ~0.3s per hash (good balance)
- 14+ = too slow for user experience

**Argon2 parameters**:

- saltLength=16, hashLength=32, parallelism=1, memory=47104, iterations=1
- Winner of Password Hashing Competition, resistant to GPU cracking

### 3.2 No plaintext secrets

```java

@Value("${jwt.private-key}")
private String privateKey; // reads from env: JWT_PRIVATE_KEY

// Vault integration (production)
@Configuration
@Import(VaultConfiguration.class)
public class SecretsConfig {
    @Value("${vault.kv.secret}")
    private String secret;
}

```

**Why**: Hardcoded secrets in code → leaked via git history, decompiled jars

### 3.3 Account lockout + exponential backoff

```java
// Track failed attempts
private Map<String, Integer> failedAttempts = new ConcurrentHashMap<>();
private Map<String, LocalDateTime> lockoutTime = new ConcurrentHashMap<>();

public void loginFailed(String username) {
    int attempts = failedAttempts.getOrDefault(username, 0) + 1;
    failedAttempts.put(username, attempts);

    if (attempts >= 5) {
        lockoutTime.put(username, LocalDateTime.now().plusMinutes(15)); // 15 min lockout
    }
}

public boolean isLocked(String username) {
    LocalDateTime locked = lockoutTime.get(username);
    if (locked != null && LocalDateTime.now().isBefore(locked)) {
        return true;
    }
    failedAttempts.remove(username);
    lockoutTime.remove(username);
    return false;
}

```

**Why N=5**: NIST recommends 5-10 attempts before lockout **Exponential backoff**: Each subsequent lockout doubles
duration (15min → 30min → 1hr)

### 3.4 Enforce password policy

```java
public void validatePassword(String password) {
    if (password.length() < 12) {
        throw new WeakPasswordException("Minimum 12 characters");
    }
    if (!password.matches(".*[A-Z].*")) {
        throw new WeakPasswordException("Must contain uppercase");
    }
    if (!password.matches(".*[a-z].*")) {
        throw new WeakPasswordException("Must contain lowercase");
    }
    if (!password.matches(".*\\d.*")) {
        throw new WeakPasswordException("Must contain digit");
    }
    if (!password.matches(".*[@#$%^&+=].*")) {
        throw new WeakPasswordException("Must contain special char");
    }
}

```

**Why length >=12**: Entropy requirement, NIST SP 800-63B guideline **Server-side validation**: Client-side can be
bypassed

----------

## **4. Minimal Security wiring (first runnable skeleton)**

### 4.1 SecurityFilterChain bean using HttpSecurity

```java

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // disable for stateless API
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/health", "/actuator/health", "/auth/**").permitAll()
                        .anyRequest().authenticated()
                )
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

        return http.build();
    }
}

```

**Why no deprecated WebSecurityConfigurerAdapter**: Removed in Spring Security 6 **Lambda DSL**: New style, no `.and()`
chaining **SessionCreationPolicy.STATELESS**: Don't create HTTP sessions for JWT APIs

### 4.2 Register AuthenticationManager

```java

@Bean
public AuthenticationManager authenticationManager(
        AuthenticationConfiguration authConfig) throws Exception {
    return authConfig.getAuthenticationManager();
}

```

**Why needed**: To manually authenticate during login endpoint (POST /auth/login)

### 4.3 Implement UserDetailsService (DB-backed)

```java

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword())
                .authorities(user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority(role.getName()))
                        .collect(Collectors.toList()))
                .accountLocked(user.isLocked())
                .disabled(!user.isEnabled())
                .build();
    }
}

```

**Why UserDetailsService**: Spring Security contract for loading user from any source (DB, LDAP, etc.) *
*accountLocked/disabled**: Built-in account status checks

### 4.4 DaoAuthenticationProvider

```java

@Bean
public DaoAuthenticationProvider authenticationProvider(
        UserDetailsService userDetailsService,
        PasswordEncoder passwordEncoder) {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(userDetailsService);
    provider.setPasswordEncoder(passwordEncoder);
    return provider;
}

```

**Why**: Links UserDetailsService + PasswordEncoder for username/password authentication

### 4.5 URL rules: permit /health, secure all others

```java
.authorizeHttpRequests(auth ->auth
        .

requestMatchers("/health","/actuator/health").

permitAll()
    .

requestMatchers("/auth/**").

permitAll()
    .

requestMatchers("/admin/**").

hasRole("ADMIN")
    .

requestMatchers(HttpMethod.DELETE, "/api/**").

hasAuthority("DELETE_PRIVILEGE")
    .

anyRequest().

authenticated()
)

```

**Order matters**: Specific rules first, general rules last **hasRole vs hasAuthority**: hasRole adds "ROLE_" prefix
automatically

----------

## **5. Auth endpoints to implement (order)**

### 5.1 POST /auth/login

```java

@PostMapping("/auth/login")
public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest request) {
    // Validate credentials
    Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
    );

    SecurityContextHolder.getContext().setAuthentication(auth);

    // Generate tokens
    String accessToken = jwtService.generateAccessToken(auth);
    String refreshToken = jwtService.generateRefreshToken(auth);

    // Store refresh token
    refreshTokenRepository.save(new RefreshToken(
            auth.getName(),
            refreshToken,
            LocalDateTime.now().plusDays(14)
    ));

    return ResponseEntity.ok(new TokenResponse(accessToken, refreshToken));
}

```

**Flow**: Authenticate → Generate access+refresh → Store refresh in DB → Return both

### 5.2 POST /auth/refresh

```java

@PostMapping("/auth/refresh")
public ResponseEntity<TokenResponse> refresh(@RequestBody RefreshRequest request) {
    String refreshToken = request.getRefreshToken();

    // Validate refresh token from DB
    RefreshToken storedToken = refreshTokenRepository.findByToken(refreshToken)
            .orElseThrow(() -> new InvalidTokenException("Refresh token not found"));

    if (storedToken.isRevoked()) {
        // Token reuse detected - revoke all user sessions
        refreshTokenRepository.revokeAllUserTokens(storedToken.getUserId());
        throw new SecurityException("Token reuse detected");
    }

    if (storedToken.isExpired()) {
        throw new InvalidTokenException("Refresh token expired");
    }

    // Mark old token as used/revoked
    storedToken.setRevoked(true);
    refreshTokenRepository.save(storedToken);

    // Generate new token pair
    UserDetails user = userDetailsService.loadUserByUsername(storedToken.getUsername());
    Authentication auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());

    String newAccessToken = jwtService.generateAccessToken(auth);
    String newRefreshToken = jwtService.generateRefreshToken(auth);

    refreshTokenRepository.save(new RefreshToken(
            user.getUsername(),
            newRefreshToken,
            LocalDateTime.now().plusDays(14)
    ));

    return ResponseEntity.ok(new TokenResponse(newAccessToken, newRefreshToken));
}

```

**Rotation pattern**: Old refresh token invalidated when used, new one issued (one-time use) **Reuse detection**: If
revoked token used again, attacker detected → revoke all sessions

### 5.3 POST /auth/logout

```java

@PostMapping("/auth/logout")
public ResponseEntity<?> logout(@RequestHeader("Authorization") String authHeader) {
    String accessToken = authHeader.substring(7); // Remove "Bearer "
    String jti = jwtService.extractJti(accessToken);
    String username = jwtService.extractUsername(accessToken);

    // Revoke refresh tokens
    refreshTokenRepository.revokeAllUserTokens(username);

    // Blacklist access token until expiry
    long remainingValidity = jwtService.getExpirationTime(accessToken) - System.currentTimeMillis();
    redisTemplate.opsForValue().set(
            "blacklist:" + jti,
            "revoked",
            remainingValidity,
            TimeUnit.MILLISECONDS
    );

    return ResponseEntity.ok("Logged out successfully");
}

```

**Why blacklist access token**: Short TTL means it expires soon, but blacklist enables immediate revocation

### 5.4 /jwks endpoint

```java

@GetMapping("/.well-known/jwks.json")
public Map<String, Object> jwks() {
    return Map.of(
            "keys", List.of(
                    Map.of(
                            "kty", "RSA",
                            "kid", keyId,
                            "use", "sig",
                            "alg", "RS256",
                            "n", Base64.getUrlEncoder().encodeToString(publicKey.getModulus().toByteArray()),
                            "e", Base64.getUrlEncoder().encodeToString(publicKey.getPublicExponent().toByteArray())
                    )
            )
    );
}

```

**Why JWKS**: Standard way to publish public keys for JWT verification by other services

----------

## **6. JWT: concrete production decisions**

### 6.1 Signing: RS256 (asymmetric)

```java
// Generate keys
KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
keyGen.

initialize(2048);

KeyPair keyPair = keyGen.generateKeyPair();
PrivateKey privateKey = keyPair.getPrivate(); // Store in Vault
PublicKey publicKey = keyPair.getPublic(); // Publish via JWKS

// Sign JWT
String jwt = Jwts.builder()
        .subject(username)
        .signWith(privateKey, SignatureAlgorithm.RS256)
        .compact();

// Verify JWT (any service with public key)
Jwts.

parser()
    .

verifyWith(publicKey)
    .

build()
    .

parseSignedClaims(jwt);

```

**Why RS256 over HS256**:

- HS256 (symmetric): Same secret for sign+verify → secret shared across services (leak risk)
- RS256 (asymmetric): Private key signs (only auth service), public key verifies (all services)
- **Use RS256 for microservices**, HS256 only for single-service monoliths

### 6.2 Claims required: iss, sub, aud, exp, iat, jti

```java
String jwt = Jwts.builder()
        .issuer("https://auth.myapp.com")           // iss: who issued token
        .subject(userId)                             // sub: user identifier
        .audience().add("https://api.myapp.com")    // aud: who should accept token
        .issuedAt(new Date())                        // iat: issued timestamp
        .expiration(new Date(System.currentTimeMillis() + 900000)) // exp: expiry
        .id(UUID.randomUUID().toString())            // jti: unique token ID (for revocation)
        .claim("scope", "read write")                // custom claims
        .signWith(privateKey, SignatureAlgorithm.RS256)
        .compact();

```

**Why each claim**:

- `iss`: Prevent token from different auth server being accepted
- `sub`: Identify user (use user ID, not username which can change)
- `aud`: Prevent token for service A being used on service B
- `exp`: Automatic expiry without server-side tracking
- `iat`: Track when issued (for audit)
- `jti`: Unique ID enables blacklisting specific token

### 6.3 TTLs: access token = 5–15 minutes; refresh token = 7–30 days

```java
public String generateAccessToken(Authentication auth) {
    return Jwts.builder()
            .subject(auth.getName())
            .expiration(new Date(System.currentTimeMillis() + 600000)) // 10 min
            .signWith(privateKey, SignatureAlgorithm.RS256)
            .compact();
}

public String generateRefreshToken(Authentication auth) {
    return Jwts.builder()
            .subject(auth.getName())
            .expiration(new Date(System.currentTimeMillis() + 1209600000)) // 14 days
            .signWith(privateKey, SignatureAlgorithm.RS256)
            .compact();
}

```

**Why short access token TTL**: If stolen, attacker has limited time window **Why long refresh token TTL**: User doesn't
need to login every 10 minutes **Tradeoff**: Shorter = more secure but more refresh calls; adjust based on risk profile

### 6.4 Validate: signature, exp, iss, aud, jti uniqueness/revocation

```java
public Claims validateToken(String token) {
    Claims claims = Jwts.parser()
            .verifyWith(publicKey)
            .requireIssuer("https://auth.myapp.com")
            .requireAudience("https://api.myapp.com")
            .build()
            .parseSignedClaims(token)
            .getPayload();

    // Check expiration (automatic with parser)
    // Check jti not in blacklist
    String jti = claims.getId();
    if (redisTemplate.hasKey("blacklist:" + jti)) {
        throw new InvalidTokenException("Token revoked");
    }

    return claims;
}

```

**Validation order**: Signature → Expiry → Issuer → Audience → Blacklist **Why this order**: Fail fast on cheap checks (
signature) before expensive ones (Redis lookup)

### 6.5 Library: Nimbus JOSE JWT

```java
// Alternative to JJWT, more features
JWSSigner signer = new RSASSASigner(privateKey);

JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
        .subject(username)
        .issuer("https://auth.myapp.com")
        .expirationTime(new Date(System.currentTimeMillis() + 900000))
        .jwtID(UUID.randomUUID().toString())
        .build();

SignedJWT signedJWT = new SignedJWT(
        new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(keyId).build(),
        claimsSet
);

signedJWT.

sign(signer);

String token = signedJWT.serialize();

```

**Why Nimbus**: Better support for advanced JWT features (JWE encryption, key rotation)

----------

## **7. Refresh token rotation & storage (exact pattern)**

### 7.1 Store refresh token server-side

```sql
CREATE TABLE refresh_tokens
(
    id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id    BIGINT       NOT NULL,
    jti        VARCHAR(255) NOT NULL UNIQUE,
    client_id  VARCHAR(255),
    issued_at  TIMESTAMP    NOT NULL,
    expires_at TIMESTAMP    NOT NULL,
    revoked    BOOLEAN DEFAULT FALSE,
    INDEX idx_user_id (user_id),
    INDEX idx_jti (jti)
);

```

```java

@Entity
public class RefreshToken {
    @Id
    @GeneratedValue
    private Long id;

    private Long userId;
    private String jti;
    private String clientId; // web, mobile-ios, mobile-android
    private LocalDateTime issuedAt;
    private LocalDateTime expiresAt;
    private boolean revoked;
}

```

**Why store refresh tokens**: Need server-side revocation capability **Why jti**: Unique identifier to track specific
token instance **Why clientId**: Allow multiple devices, revoke specific device

### 7.2 On /auth/refresh: verify, mark used, issue new (one-time use)

**Pattern implementation**: See section 5.2 above

**Why one-time use**: Prevents replay attacks, enables reuse detection

### 7.3 Reuse detection: revoke all sessions

```java
if(storedToken.isRevoked()){
        // Token already used - likely stolen and replayed
        logger.

warn("Refresh token reuse detected for user: {}",storedToken.getUserId());

        // Revoke ALL refresh tokens for user
        refreshTokenRepository.

revokeAllUserTokens(storedToken.getUserId());

        // Send alert
        alertService.

sendSecurityAlert(storedToken.getUserId(), "Token reuse detected");

        throw new

SecurityException("Token reuse detected - all sessions revoked");
}

```

**Why nuclear option**: If attacker has refresh token and tries to reuse, force user to re-authenticate everywhere

----------

## **8. Token revocation & logout (practical)**

### 8.1 Revocation store (Redis) keyed by jti with TTL

```java

@Service
public class TokenRevocationService {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    public void revokeToken(String jti, long remainingValidityMs) {
        redisTemplate.opsForValue().set(
                "blacklist:" + jti,
                "revoked",
                remainingValidityMs,
                TimeUnit.MILLISECONDS
        );
    }

    public boolean isRevoked(String jti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey("blacklist:" + jti));
    }
}

```

**Why Redis**: Fast O(1) lookup, TTL auto-cleanup (no manual deletion needed) **TTL = remaining life**: Once token
expires naturally, no need to track anymore

### 8.2 /auth/logout actions

**Implementation**: See section 5.3 above

**Why mark refresh revoked + blacklist access**:

- Refresh token revoked → can't get new access tokens
- Access token blacklisted → current access token immediately invalid

### 8.3 Stateless access tokens: rely on short TTL + blacklist

**Tradeoff**:

- Pure stateless (no blacklist): Can't revoke until expiry, but simpler
- Blacklist approach: Immediate revoke capability, but requires Redis lookup on each request

**When to use blacklist**: High-security scenarios (banking, healthcare) **When to skip**: Low-risk apps, rely on 5-min
TTL

### 8.4 Absolute immediate invalidate: use opaque tokens + introspection

```java
// Opaque token (random string, no JWT)
String opaqueToken = UUID.randomUUID().toString();
tokenStore.

put(opaqueToken, new TokenMetadata(userId, scopes, expiry));

// Introspection endpoint
@PostMapping("/oauth/introspect")
public TokenIntrospectionResponse introspect(@RequestParam String token) {
    TokenMetadata metadata = tokenStore.get(token);
    if (metadata == null || metadata.isExpired()) {
        return new TokenIntrospectionResponse(false);
    }
    return new TokenIntrospectionResponse(true, metadata);
}

```

**Why opaque tokens**: Server controls validity completely, instant revoke by deleting from store **Tradeoff**: Every
request requires DB/Redis lookup (slower than JWT signature verification)

----------

## **9. Filter chain & placement (must-follow)**

### 9.1 Use Spring Resource Server

```java
http.oauth2ResourceServer(oauth2 ->oauth2
        .

jwt(jwt ->jwt
        .

decoder(jwtDecoder())
        .

jwtAuthenticationConverter(jwtAuthenticationConverter())
        )
        );

@Bean
public JwtDecoder jwtDecoder() {
    return NimbusJwtDecoder.withPublicKey(publicKey).build();
}

@Bean
public JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
    grantedAuthoritiesConverter.setAuthoritiesClaimName("scope");
    grantedAuthoritiesConverter.setAuthorityPrefix("SCOPE_");

    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
    return converter;
}

```

**Why use oauth2ResourceServer**: Spring handles token parsing, validation, and Authentication creation automatically *
*BearerTokenAuthenticationFilter**: Extracts "Bearer <token>" from Authorization header

### 9.2 Custom OncePerRequestFilter placement

```java

@Component
public class IpWhitelistFilter extends OncePerRequestFilter {

    private static final Set<String> ALLOWED_IPS = Set.of("192.168.1.100", "10.0.0.50");

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String clientIp = request.getRemoteAddr();

        if (!ALLOWED_IPS.contains(clientIp)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("IP not allowed");
            return;
        }

        filterChain.doFilter(request, response);
    }
}

// In SecurityConfig
http.

addFilterBefore(ipWhitelistFilter, BearerTokenAuthenticationFilter .class);

```

**Why before authentication filter**: Reject bad requests early, save CPU on JWT parsing **OncePerRequestFilter**:
Guaranteed to execute once per request (not per forward/include)

### 9.3 Define AuthenticationEntryPoint (401) and AccessDeniedHandler (403)

```java

@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.getWriter().write("{\"error\": \"Authentication required\"}");
    }
}

@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {
    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.getWriter().write("{\"error\": \"Access denied\"}");
    }
}

// In SecurityConfig
http
        .

exceptionHandling(ex ->ex
        .

authenticationEntryPoint(authenticationEntryPoint)
        .

accessDeniedHandler(accessDeniedHandler)
    );

```

**Why custom handlers**: Default HTML error pages bad for APIs, need consistent JSON responses **401 vs 403**: 401 = not
authenticated (not logged in), 403 = authenticated but not authorized (logged in but insufficient permissions)

----------

## **10. CORS & CSRF (exact config)**

### 10.1 CORS with exact allowed origins

```java

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList("https://myapp.com", "https://www.myapp.com"));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
    configuration.setExposedHeaders(Arrays.asList("X-Total-Count"));
    configuration.setAllowCredentials(false); // false for Bearer tokens
    configuration.setMaxAge(3600L); // Cache preflight for 1 hour

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}

// In SecurityConfig
http.

cors(cors ->cors.

configurationSource(corsConfigurationSource()));

```

**Why not wildcard in prod**: `*` allows any domain, security risk **allowCredentials=false**: Cookies not needed with
Bearer tokens, prevents CSRF **maxAge**: Reduces preflight OPTIONS requests

### 10.2 For JWT (no cookies): csrf().disable()

```java
http.csrf(csrf ->csrf.

disable());

```

**Why disable**: CSRF exploits rely on cookies being sent automatically; Bearer tokens require manual header setting

### 10.3 If cookies used: enable CSRF

```java
http
        .csrf(csrf ->csrf
        .

csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
        .

csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler())
        )
        .

addFilterAfter(new CsrfCookieFilter(),BasicAuthenticationFilter.class);

// Cookie attributes
@Bean
public CookieCsrfTokenRepository csrfTokenRepository() {
    CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
    repository.setCookiePath("/");
    repository.setCookieName("XSRF-TOKEN");
    return repository;
}

```

**SameSite cookie attribute**:

```java
// In application.yml
server:
servlet:
session:
cookie:
same-site:strict #
or lax

```

**Why SameSite=Strict**: Prevents cookie from being sent in cross-site requests (CSRF protection) **Lax vs Strict**: Lax
allows top-level navigation (clicking links), Strict blocks all cross-site

----------

## **11. URL & method-level auth (practical rules)**

### 11.1 Authorization rules order: specific-first, generic-last

```java
http.authorizeHttpRequests(auth ->auth
        .

requestMatchers("/public/**").

permitAll()
    .

requestMatchers("/auth/**").

permitAll()

// Specific endpoints first
    .

requestMatchers("/api/admin/users").

hasRole("SUPER_ADMIN")
    .

requestMatchers("/api/admin/**").

hasRole("ADMIN")

// HTTP method based
    .

requestMatchers(HttpMethod.DELETE, "/api/**").

hasAuthority("DELETE_PRIVILEGE")
    .

requestMatchers(HttpMethod.POST, "/api/**").

hasAuthority("WRITE_PRIVILEGE")
    .

requestMatchers(HttpMethod.GET, "/api/**").

hasAuthority("READ_PRIVILEGE")

// Generic fallback
    .

anyRequest().

authenticated()
)

```

**Why order matters**: First matching rule wins **Common mistake**: Putting `.anyRequest().authenticated()` before
specific rules → all requests need auth

### 11.2 @EnableMethodSecurity + @PreAuthorize

```java

@Configuration
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true, jsr250Enabled = true)
public class MethodSecurityConfig {
}

@Service
public class OrderService {

    @PreAuthorize("hasRole('USER')")
    public Order createOrder(Order order) {
        // Only users with ROLE_USER can call this
    }

    @PreAuthorize("hasAuthority('SCOPE_write')")
    public void updateOrder(Long id, Order order) {
        // Check for specific scope
    }

    @PreAuthorize("#username == authentication.principal.username or hasRole('ADMIN')")
    public Order getOrder(String username, Long orderId) {
        // Users can only get their own orders, admins can get any
    }

    @PostAuthorize("returnObject.userId == authentication.principal.userId")
    public Order findOrderById(Long id) {
        // Check after execution - user can only see their own order
    }

    @PreAuthorize("@orderSecurityService.canAccessOrder(authentication, #orderId)")
    public Order customCheck(Long orderId) {
        // Delegate to custom bean for complex logic
    }
}

@Component("orderSecurityService")
public class OrderSecurityService {
    public boolean canAccessOrder(Authentication auth, Long orderId) {
        // Complex business logic
        return true;
    }
}

```

**@PreAuthorize vs @PostAuthorize**:

- Pre: Check before method execution (fail fast)
- Post: Check after execution (useful when you need return value for decision)

**@Secured vs @PreAuthorize**:

- @Secured: Only role checks, e.g., `@Secured("ROLE_ADMIN")`
- @PreAuthorize: Full SpEL expressions, more flexible

**JSR-250 annotations**:

- `@RolesAllowed("ADMIN")` - Standard Java annotation
- `@PermitAll` - Allow everyone
- `@DenyAll` - Block everyone

### 11.3 Map JWT scopes/claims to GrantedAuthority

```java

@Bean
public JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();

    // Map "scope" claim to authorities with SCOPE_ prefix
    grantedAuthoritiesConverter.setAuthoritiesClaimName("scope");
    grantedAuthoritiesConverter.setAuthorityPrefix("SCOPE_");

    // Custom converter for roles
    Converter<Jwt, Collection<GrantedAuthority>> customConverter = jwt -> {
        Collection<GrantedAuthority> authorities = new ArrayList<>();

        // Extract roles from custom claim
        List<String> roles = jwt.getClaimAsStringList("roles");
        if (roles != null) {
            roles.forEach(role -> authorities.add(new SimpleGrantedAuthority("ROLE_" + role)));
        }

        // Extract scopes
        String scope = jwt.getClaimAsString("scope");
        if (scope != null) {
            Arrays.stream(scope.split(" "))
                    .forEach(s -> authorities.add(new SimpleGrantedAuthority("SCOPE_" + s)));
        }

        return authorities;
    };

    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(customConverter);
    return converter;
}

```

**Why mapping**: JWT claims (strings) → GrantedAuthority objects that Spring Security understands **Scope claim format
**: Space-separated string, e.g., `"read write delete"`

----------

## **12. Production hardening checklist (deploy gating)**

### 12.1 Enforce HTTPS & HSTS

```java
// Redirect HTTP to HTTPS
@Bean
public ServletWebServerFactory servletContainer() {
    TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory() {
        @Override
        protected void postProcessContext(Context context) {
            SecurityConstraint securityConstraint = new SecurityConstraint();
            securityConstraint.setUserConstraint("CONFIDENTIAL");
            SecurityCollection collection = new SecurityCollection();
            collection.addPattern("/*");
            securityConstraint.addCollection(collection);
            context.addConstraint(securityConstraint);
        }
    };
    tomcat.addAdditionalTomcatConnectors(redirectConnector());
    return tomcat;
}

private Connector redirectConnector() {
    Connector connector = new Connector("org.apache.coyote.http11.Http11NioProtocol");
    connector.setScheme("http");
    connector.setPort(8080);
    connector.setSecure(false);
    connector.setRedirectPort(8443);
    return connector;
}

// HSTS header
http.

headers(headers ->headers
        .

httpStrictTransportSecurity(hsts ->hsts
        .

includeSubDomains(true)
        .

maxAgeInSeconds(31536000) // 1 year
    )
            );

```

**Why HTTPS**: Prevent man-in-the-middle attacks, encrypt tokens in transit **HSTS**: Tells browser to always use HTTPS
for this domain (even if user types http://) **includeSubDomains**: Apply to all subdomains too

### 12.2 Private keys in Vault/KMS; rotate regularly

```java
// Vault integration
@Configuration
public class VaultConfig {

    @Bean
    public VaultTemplate vaultTemplate() {
        VaultEndpoint endpoint = VaultEndpoint.create("vault.myapp.com", 8200);
        VaultToken token = VaultToken.of(System.getenv("VAULT_TOKEN"));
        return new VaultTemplate(endpoint, new TokenAuthentication(token));
    }

    @Bean
    public PrivateKey privateKey(VaultTemplate vaultTemplate) {
        VaultResponse response = vaultTemplate.read("secret/jwt/private-key");
        String keyData = (String) response.getData().get("value");

        byte[] keyBytes = Base64.getDecoder().decode(keyData);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePrivate(spec);
    }
}

// Key rotation strategy
@Scheduled(cron = "0 0 0 1 * ?") // First day of each month
public void rotateKeys() {
    KeyPair newKeyPair = generateKeyPair();
    String newKeyId = "key-" + System.currentTimeMillis();

    // Store new key in Vault
    vaultTemplate.write("secret/jwt/private-key-" + newKeyId,
            Map.of("value", Base64.getEncoder().encodeToString(newKeyPair.getPrivate().getEncoded())));

    // Publish new public key to JWKS with new kid
    jwksService.addKey(newKeyId, newKeyPair.getPublic());

    // Keep old keys for validation window (e.g., 24 hours)
    // Then remove from JWKS after window
}

```

**Why Vault**: Centralized secret management, audit logs, dynamic secrets **Key rotation**: Limit blast radius if key
compromised **Validation window**: Old tokens still valid during rotation period

### 12.3 Minimum TLS 1.2/1.3 and approved cipher suites

```yaml
# application.yml
server:
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: ${KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    key-alias: tomcat
    protocol: TLS
    enabled-protocols: TLSv1.3,TLSv1.2
    ciphers: >
      TLS_AES_128_GCM_SHA256,
      TLS_AES_256_GCM_SHA384,
      TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
      TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384

```

**Why disable TLS 1.0/1.1**: Known vulnerabilities (POODLE, BEAST) **Approved ciphers**: NIST recommended, forward
secrecy

### 12.4 Secure actuator endpoints

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
        exclude: env,beans,mappings
      base-path: /actuator
  endpoint:
    health:
      show-details: when-authorized

```

```java
http.authorizeHttpRequests(auth ->auth
        .

requestMatchers("/actuator/health").

permitAll()
    .

requestMatchers("/actuator/**").

hasRole("ACTUATOR_ADMIN")
);

```

**Why restrict**: /actuator/env exposes environment variables, /beans shows all beans (potential security info leak) *
*IP restriction at gateway**: Additional layer, only allow internal IPs

### 12.5 Disable detailed error messages and stacktrace

```yaml
server:
  error:
    include-message: never
    include-binding-errors: never
    include-stacktrace: never
    include-exception: false

```

```java

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        // Log full details server-side
        logger.error("Error occurred", ex);

        // Return generic message to client
        return ResponseEntity.status(500)
                .body(new ErrorResponse("Internal server error", "ERR_500"));
    }
}

```

**Why**: Stacktraces reveal internal structure, framework versions (helps attackers)

----------

## **13. Rate limiting & brute-force (deployable fast)**

### 13.1 Login throttling: Bucket4j + Redis

```xml

<dependency>
    <groupId>com.bucket4j</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>8.7.0</version>
</dependency>
<dependency>
<groupId>com.bucket4j</groupId>
<artifactId>bucket4j-redis</artifactId>
<version>8.7.0</version>
</dependency>

```

```java

@Component
public class LoginRateLimiter {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    public boolean allowLogin(String username, String ip) {
        // Per-username limit: 5 attempts per 15 minutes
        String usernameKey = "ratelimit:user:" + username;
        if (!checkBucket(usernameKey, 5, Duration.ofMinutes(15))) {
            return false;
        }

        // Per-IP limit: 20 attempts per 15 minutes (prevent distributed brute force)
        String ipKey = "ratelimit:ip:" + ip;
        if (!checkBucket(ipKey, 20, Duration.ofMinutes(15))) {
            return false;
        }

        return true;
    }

    private boolean checkBucket(String key, long capacity, Duration refillDuration) {
        Bandwidth limit = Bandwidth.simple(capacity, refillDuration);
        BucketConfiguration config = BucketConfiguration.builder()
                .addLimit(limit)
                .build();

        Bucket bucket = Bucket.builder()
                .addLimit(limit)
                .build();

        // Implement with Redis distributed bucket
        return bucket.tryConsume(1);
    }

    public void loginFailed(String username) {
        int attempts = incrementFailedAttempts(username);

        if (attempts == 3) {
            // Warning at 3 attempts
            alertService.sendWarning(username, "Multiple failed login attempts");
        } else if (attempts >= 5) {
            // Exponential backoff: 5 fails = 15min, 10 fails = 30min, 15 fails = 1hr
            long lockoutMinutes = (long) Math.pow(2, (attempts / 5)) * 15;
            lockAccount(username, Duration.ofMinutes(lockoutMinutes));
            alertService.sendAlert(username, "Account locked due to failed attempts");
        }
    }

    private int incrementFailedAttempts(String username) {
        String key = "failed:attempts:" + username;
        Long attempts = redisTemplate.opsForValue().increment(key);
        redisTemplate.expire(key, 1, TimeUnit.HOURS);
        return attempts.intValue();
    }
}

// In login controller
@PostMapping("/auth/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
    String ip = httpRequest.getRemoteAddr();

    if (!rateLimiter.allowLogin(request.getUsername(), ip)) {
        return ResponseEntity.status(429).body("Too many login attempts, try again later");
    }

    try {
        // Authenticate...
        rateLimiter.loginSucceeded(request.getUsername());
    } catch (BadCredentialsException e) {
        rateLimiter.loginFailed(request.getUsername());
        return ResponseEntity.status(401).body("Invalid credentials");
    }
}

```

**Why 5 attempts**: NIST SP 800-63B recommendation **Why per-IP + per-username**: Prevent both credential stuffing and
distributed attacks **Exponential backoff**: First lockout short (user mistake), repeated attempts longer (attacker)

### 13.2 API-level limits at gateway

```nginx
# NGINX rate limiting
http {
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    
    server {
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://backend;
        }
    }
}

```

```java
// Spring rate limiting (alternative)
@Configuration
public class RateLimitConfig {

    @Bean
    public RateLimiter apiRateLimiter() {
        return RateLimiter.create(100.0); // 100 requests per second
    }
}

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    @Autowired
    private RateLimiter rateLimiter;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!rateLimiter.tryAcquire()) {
            response.setStatus(429);
            response.getWriter().write("Rate limit exceeded");
            return;
        }
        filterChain.doFilter(request, response);
    }
}

```

**Gateway vs Application**: Gateway (NGINX/CloudFront) protects infrastructure, Application protects business logic *
*Burst**: Allow short bursts above limit (handle traffic spikes)

----------

## **14. Secrets & keys rotation (operational)**

### 14.1 Use Vault/KMS for secrets

```java
// AWS KMS example
@Configuration
public class KmsConfig {

    @Bean
    public AWSKMS kmsClient() {
        return AWSKMSClientBuilder.standard()
                .withRegion(Regions.US_EAST_1)
                .build();
    }

    @Bean
    public String jwtSecret(AWSKMS kmsClient) {
        DecryptRequest request = new DecryptRequest()
                .withCiphertextBlob(ByteBuffer.wrap(
                        Base64.getDecoder().decode(System.getenv("ENCRYPTED_JWT_SECRET"))
                ));

        DecryptResult result = kmsClient.decrypt(request);
        return new String(result.getPlaintext().array());
    }
}

```

**Why KMS**: AWS manages encryption keys, audit trail, access control via IAM **Never in repo**: Even encrypted values
shouldn't be in git (use env vars)

### 14.2 Key rotation: publish new JWKS kid, keep old keys

```java

@Service
public class JwksService {

    private Map<String, PublicKey> activeKeys = new ConcurrentHashMap<>();

    public void rotateKeys() {
        String newKeyId = "key-" + System.currentTimeMillis();
        KeyPair newKeyPair = generateKeyPair();

        // Add new key
        activeKeys.put(newKeyId, newKeyPair.getPublic());

        // Start using new key for signing
        currentKeyId = newKeyId;
        currentPrivateKey = newKeyPair.getPrivate();

        // Schedule old key removal after grace period
        scheduler.schedule(() -> {
            // Remove keys older than 24 hours
            long cutoff = System.currentTimeMillis() - (24 * 60 * 60 * 1000);
            activeKeys.entrySet().removeIf(entry ->
                    Long.parseLong(entry.getKey().substring(4)) < cutoff
            );
        }, 24, TimeUnit.HOURS);
    }

    @GetMapping("/.well-known/jwks.json")
    public Map<String, Object> getJwks() {
        List<Map<String, Object>> keys = activeKeys.entrySet().stream()
                .map(entry -> Map.of(
                        "kty", "RSA",
                        "kid", entry.getKey(),
                        "use", "sig",
                        "alg", "RS256",
                        "n", base64UrlEncode(((RSAPublicKey) entry.getValue()).getModulus()),
                        "e", base64UrlEncode(((RSAPublicKey) entry.getValue()).getPublicExponent())
                ))
                .collect(Collectors.toList());

        return Map.of("keys", keys);
    }
}

```

**Grace period**: Old tokens still valid during rotation window **kid (Key ID)**: Clients use kid from JWT header to
fetch correct public key from JWKS

### 14.3 Audit key access and alert

```java

@Aspect
@Component
public class KeyAccessAuditor {

    @Around("execution(* com.example.security.KeyService.getPrivateKey(..))")
    public Object auditKeyAccess(ProceedingJoinPoint joinPoint) throws Throwable {
        String user = SecurityContextHolder.getContext().getAuthentication().getName();
        String ip = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
                .getRequest().getRemoteAddr();

        auditLog.log("Private key accessed by user={}, ip={}", user, ip);

        // Alert on unauthorized access
        if (!authorizedKeyUsers.contains(user)) {
            alertService.sendCriticalAlert("Unauthorized key access attempt by " + user);
        }

        return joinPoint.proceed();
    }
}

```

**Why audit**: Detect insider threats, compromised service accounts **Alert on unauthorized**: Immediate notification
for investigation

----------

## **15. Logging, monitoring & alerting (practical signals)**

### 15.1 Log auth events (never log tokens/passwords)

```java

@Component
public class AuthenticationEventListener {

    private static final Logger auditLogger = LoggerFactory.getLogger("AUDIT");

    @EventListener
    public void onAuthenticationSuccess(AuthenticationSuccessEvent event) {
        String username = event.getAuthentication().getName();
        String ip = getClientIp();

        auditLogger.info("LOGIN_SUCCESS username={} ip={} timestamp={}",
                username, ip, Instant.now());
    }

    @EventListener
    public void onAuthenticationFailure(AuthenticationFailureBadCredentialsEvent event) {
        String username = event.getAuthentication().getName();
        String ip = getClientIp();

        auditLogger.warn("LOGIN_FAILURE username={} ip={} reason=BAD_CREDENTIALS timestamp={}",
                username, ip, Instant.now());
    }

    @EventListener
    public void onAuthorizationFailure(AuthorizationDeniedEvent event) {
        String username = event.getAuthentication().getName();
        String resource = event.getSource().toString();

        auditLogger.warn("AUTHORIZATION_FAILURE username={} resource={} timestamp={}",
                username, resource, Instant.now());
    }

    private String getClientIp() {
        ServletRequestAttributes attrs = (ServletRequestAttributes)
                RequestContextHolder.currentRequestAttributes();
        HttpServletRequest request = attrs.getRequest();

        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}

```

**What to log**: Username, IP, timestamp, action result, resource accessed **What NOT to log**: Passwords, tokens, full
request bodies with sensitive data **Structured logging**: Use key=value format for easy parsing by log aggregators

### 15.2 Monitor: spikes, reuse, suspicious patterns

```java

@Service
public class SecurityMonitoringService {

    @Scheduled(fixedRate = 60000) // Every minute
    public void detectAnomalies() {
        // Failed login spike detection
        long failedLogins = auditRepository.countFailedLoginsInLastMinute();
        if (failedLogins > 100) {
            alertService.sendAlert("HIGH_FAILED_LOGINS", "Failed logins: " + failedLogins);
        }

        // Multiple IPs for same user (account sharing or compromise)
        List<String> usersWithMultipleIps = auditRepository.findUsersWithMultipleIpsInLastHour();
        for (String user : usersWithMultipleIps) {
            alertService.sendAlert("MULTIPLE_IPS", "User " + user + " logged in from multiple IPs");
        }

        // Refresh token reuse attempts
        long reuseAttempts = refreshTokenRepository.countReuseAttemptsInLastHour();
        if (reuseAttempts > 0) {
            alertService.sendCriticalAlert("TOKEN_REUSE", "Refresh token reuse attempts: " + reuseAttempts);
        }

        // Unusual access patterns (user suddenly accessing many resources)
        List<String> suspiciousUsers = auditRepository.findUsersWithUnusualAccessPatterns();
        for (String user : suspiciousUsers) {
            alertService.sendAlert("UNUSUAL_PATTERN", "Unusual access pattern for user: " + user);
        }
    }
}

```

**Anomaly detection patterns**:

- Sudden spike in failed logins (brute force attack)
- User accessing resources they never accessed before
- Geographic anomaly (login from US then China 5 minutes later)
- Time anomaly (user active at 3 AM when normally 9-5)

### 15.3 Alerts: trigger automated revocation

```java

@Service
public class AutomatedResponseService {

    public void handleSuspiciousActivity(String userId, String reason) {
        // Log incident
        securityIncidentRepository.save(new SecurityIncident(userId, reason, Instant.now()));

        // Automated actions based on severity
        if (reason.contains("TOKEN_REUSE") || reason.contains("MULTIPLE_IPS")) {
            // High severity - immediate action
            revokeAllUserSessions(userId);
            lockAccount(userId, Duration.ofHours(1));
            notifyUser(userId, "Suspicious activity detected, account temporarily locked");
            notifySecurityTeam(userId, reason);
        } else if (reason.contains("FAILED_LOGINS")) {
            // Medium severity - watch and restrict
            enableStrictModeForUser(userId); // Require 2FA, limit API calls
            notifyUser(userId, "Multiple failed login attempts detected");
        }

        // Create ticket for manual review
        ticketingService.createSecurityIncident(userId, reason);
    }

    private void revokeAllUserSessions(String userId) {
        refreshTokenRepository.revokeAllUserTokens(userId);

        // Blacklist all active access tokens
        List<String> activeTokens = tokenRepository.findActiveTokensByUser(userId);
        for (String jti : activeTokens) {
            tokenRevocationService.revokeToken(jti, 900000); // 15 min TTL
        }
    }
}

```

**Automated vs Manual**: Balance between quick response and false positives **Notify user**: Transparency builds trust,
lets legitimate user know to change password

----------

## **16. Testing to implement (must-have tests)**

### 16.1 Unit tests: @WithMockUser

```java

@SpringBootTest
@AutoConfigureMockMvc
class SecurityUnitTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(username = "user", roles = "USER")
    void testUserCanAccessUserEndpoint() throws Exception {
        mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "user", roles = "USER")
    void testUserCannotAccessAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUnauthenticatedUserCannotAccessProtectedEndpoint() throws Exception {
        mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testAdminCanAccessAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isOk());
    }

    @Test
    void testSecurityContextHoldsAuthentication() {
        Authentication auth = new UsernamePasswordAuthenticationToken("user", "password",
                List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        Authentication retrieved = SecurityContextHolder.getContext().getAuthentication();
        assertThat(retrieved.getName()).isEqualTo("user");
        assertThat(retrieved.getAuthorities()).hasSize(1);
    }
}

```

**@WithMockUser**: Simulates authenticated user without actual authentication **SecurityContext assertions**: Verify
authentication object populated correctly

### 16.2 Integration tests: MockMvc or TestRestTemplate

```java

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SecurityIntegrationTests {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setup() {
        User user = new User();
        user.setUsername("testuser");
        user.setPassword(passwordEncoder.encode("password"));
        user.setRole("ROLE_USER");
        userRepository.save(user);
    }

    @Test
    void testLoginFlowAndAccessProtectedResource() {
        // 1. Login
        LoginRequest loginRequest = new LoginRequest("testuser", "password");
        ResponseEntity<TokenResponse> loginResponse = restTemplate.postForEntity(
                "/auth/login", loginRequest, TokenResponse.class);

        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        String accessToken = loginResponse.getBody().getAccessToken();
        assertThat(accessToken).isNotNull();

        // 2. Access protected resource with token
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<String> profileResponse = restTemplate.exchange(
                "/api/user/profile", HttpMethod.GET, entity, String.class);

        assertThat(profileResponse.getStatusCode()).isEqualTo(HttpStatus.OK());
    }

    @Test
    void testRefreshTokenRotation() {
        // 1. Login and get tokens
        TokenResponse tokens = login("testuser", "password");
        String originalRefreshToken = tokens.getRefreshToken();

        // 2. Use refresh token
        RefreshRequest refreshRequest = new RefreshRequest(originalRefreshToken);
        ResponseEntity<TokenResponse> refreshResponse = restTemplate.postForEntity(
                "/auth/refresh", refreshRequest, TokenResponse.class);

        assertThat(refreshResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        String newRefreshToken = refreshResponse.getBody().getRefreshToken();
        assertThat(newRefreshToken).isNotEqualTo(originalRefreshToken);

        // 3. Try to reuse old refresh token - should fail
        RefreshRequest reuseRequest = new RefreshRequest(originalRefreshToken);
        ResponseEntity<String> reuseResponse = restTemplate.postForEntity(
                "/auth/refresh", reuseRequest, String.class);

        assertThat(reuseResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void testLogoutInvalidatesAccessToken() {
        // 1. Login
        TokenResponse tokens = login("testuser", "password");

        // 2. Logout
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(tokens.getAccessToken());
        HttpEntity<String> logoutEntity = new HttpEntity<>(headers);

        ResponseEntity<String> logoutResponse = restTemplate.exchange(
                "/auth/logout", HttpMethod.POST, logoutEntity, String.class);

        assertThat(logoutResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        // 3. Try to access protected resource with logged-out token - should fail
        ResponseEntity<String> accessResponse = restTemplate.exchange(
                "/api/user/profile", HttpMethod.GET, logoutEntity, String.class);

        assertThat(accessResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private TokenResponse login(String username, String password) {
        LoginRequest request = new LoginRequest(username, password);
        return restTemplate.postForObject("/auth/login", request, TokenResponse.class);
    }
}

```

