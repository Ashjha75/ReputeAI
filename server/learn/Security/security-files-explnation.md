# JWT Security System - Complete Documentation

----------

## 🎯 System Overview

This is a **JWT-based authentication and authorization system** for a Patient Management application built with Spring
Boot. It uses:

- **JWT Tokens** for stateless authentication
- **Role-Based Access Control (RBAC)** for authorization
- **OAuth2** for third-party login (Google, GitHub)
- **Permission-based** access to different modules

----------

## 🔄 Security Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPRING BOOT APPLICATION STARTUP               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 1️⃣ ApplicationConfig.java - Loads Basic Beans                   │
│    • PasswordEncoder (BCrypt)                                    │
│    • AuthenticationManager                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2️⃣ DataSeeder.java - Seeds Initial Data                         │
│    • Creates Modules (Patient Management, User Management)       │
│    • Creates Roles (ADMIN, USER, PATIENT)                        │
│    • Assigns Permissions to Roles                                │
│    • Creates Default Users                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3️⃣ SecurityConfig.java - Configures Security                    │
│    • Sets up security filter chain                               │
│    • Configures public/private endpoints                         │
│    • Adds JWT filter before authentication                       │
│    • Configures OAuth2 login                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION IS NOW READY                      │
└─────────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│                    USER LOGIN REQUEST FLOW                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┴─────────────────────┐
        │                                            │
   [LOCAL LOGIN]                              [OAUTH2 LOGIN]
        │                                            │
        ↓                                            ↓
┌──────────────────┐                    ┌──────────────────────┐
│ User sends       │                    │ User clicks          │
│ username/password│                    │ "Login with Google"  │
│ to /api/auth/login│                   │ or "Login with GitHub│
└──────────────────┘                    └──────────────────────┘
        ↓                                            ↓
┌──────────────────┐                    ┌──────────────────────┐
│ AuthController   │                    │ OAuth2 redirects to  │
│ validates        │                    │ provider             │
│ credentials      │                    └──────────────────────┘
└──────────────────┘                                ↓
        ↓                                ┌──────────────────────┐
┌──────────────────┐                    │ User logs in at      │
│ JwtUtils         │                    │ Google/GitHub        │
│ generates JWT    │                    └──────────────────────┘
└──────────────────┘                                ↓
        ↓                                ┌──────────────────────┐
┌──────────────────┐                    │ OAuth2SuccessHandler │
│ Returns JWT to   │                    │ processes OAuth data │
│ client           │                    └──────────────────────┘
└──────────────────┘                                ↓
        │                                ┌──────────────────────┐
        │                                │ Oauth2Utils extracts │
        │                                │ user info            │
        │                                └──────────────────────┘
        │                                            ↓
        │                                ┌──────────────────────┐
        │                                │ JwtUtils generates   │
        │                                │ JWT                  │
        │                                └──────────────────────┘
        │                                            │
        └────────────────────┬───────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT HAS JWT TOKEN                          │
└─────────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│              ACCESSING PROTECTED ENDPOINT FLOW                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ User sends request to protected endpoint                         │
│ GET /api/v1/patients                                             │
│ Header: Authorization: Bearer <JWT_TOKEN>                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4️⃣ AuthTokenFilter.java - INTERCEPTS EVERY REQUEST              │
│    Step 1: Extract JWT from Authorization header                │
│    Step 2: Validate JWT using JwtUtils                          │
│    Step 3: Extract username from JWT                            │
│    Step 4: Load user details from database                      │
│    Step 5: Create Authentication object                         │
│    Step 6: Set Authentication in SecurityContext                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    │  Is JWT Valid?    │
                    └─────────┬─────────┘
                              │
            ┌─────────────────┴─────────────────┐
            │                                    │
          [YES]                                [NO]
            │                                    │
            ↓                                    ↓
┌──────────────────────┐          ┌──────────────────────────┐
│ Continue to          │          │ 5️⃣ AuthEntryPointJwt.java│
│ Controller           │          │    Returns 401           │
└──────────────────────┘          │    Unauthorized          │
            ↓                     │    JSON error            │
┌──────────────────────┐          └──────────────────────────┘
│ 6️⃣ Controller checks │                    ↓
│    @PreAuthorize     │          ┌──────────────────────────┐
│    annotation        │          │ Request ends here        │
└──────────────────────┘          │ No access to endpoint    │
            ↓                     └──────────────────────────┘
┌──────────────────────┐
│ Calls                │
│ CustomPermission     │
│ Service              │
└──────────────────────┘
            ↓
┌──────────────────────┐
│ 7️⃣ CustomPermission  │
│    Service checks    │
│    if user has       │
│    required          │
│    permission        │
└──────────────────────┘
            ↓
    ┌───────┴───────┐
    │ Has Permission?│
    └───────┬───────┘
            │
    ┌───────┴───────┐
    │               │
  [YES]           [NO]
    │               │
    ↓               ↓
[Execute]    [403 Forbidden]
[Controller] [Access Denied]
[Method]

```

----------

## 📄 File Documentation (In Flow Order)

### 1️⃣ ApplicationConfig.java

**When it runs:** Application startup (before anything else)

**Purpose:** Creates basic security beans that other components need

**Functions:**

#### `passwordEncoder()`

```java

@Bean
public PasswordEncoder passwordEncoder()

```

**What it does:**

- Creates a BCrypt password encoder
- This is used to hash passwords before storing in database
- BCrypt automatically adds salt and is slow (good for security)

**Example:**

```java
String rawPassword = "myPassword123";
String hashed = passwordEncoder.encode(rawPassword);
// Result: $2a$10$N9qo8uLOickgx2ZMRZoMye...

```

#### `authenticationManager()`

```java

@Bean
public AuthenticationManager authenticationManager(AuthenticationConfiguration config)

```

**What it does:**

- Creates the main authentication manager
- This manager handles all authentication requests
- Used during login to verify username/password

**When used:**

- During login process
- To validate user credentials

----------

### 2️⃣ DataSeeder.java

**When it runs:** Application startup (after ApplicationConfig)

**Purpose:** Seeds initial data into the database (modules, roles, permissions, users)

**Functions:**

#### `run()`

```java

@Override
public void run(String... args)

```

**What it does:**

- Creates modules (Patient Management, User Management)
- Creates roles (ROLE_USER, ROLE_PATIENT, ROLE_ADMIN)
- Assigns permissions to roles
- Creates sample users with roles

**Flow:**

```
1. Create "Patient Management" module
2. Create "User Management" module
3. Create ROLE_USER (empty permissions - for new signups)
4. Create ROLE_PATIENT with VIEW, EDIT permissions
5. Create ROLE_ADMIN with CREATE, VIEW, EDIT, DELETE, LIST permissions
6. Create sample users:
   - janesmith (ROLE_PATIENT)
   - superadmin2 (ROLE_ADMIN)

```

#### `createModuleIfNotFound()`

```java
private Module createModuleIfNotFound(String name, String key, String path)

```

**What it does:**

- Checks if module exists in database
- If not found, creates new module
- Returns the module

**Example:**

```java
Module patientModule = createModuleIfNotFound(
        "Patient Management",      // Display name
        "PATIENT_MANAGEMENT",      // Unique key
        "/api/v1/patients"         // URL path
);

```

#### `createRoleAndAssignPermissions()`

```java
private Role createRoleAndAssignPermissions(String roleName, Module module, Set<Permission> permissions)

```

**What it does:**

- Creates a role if it doesn't exist
- Assigns permissions to that role for a specific module

**Example:**

```java
Role adminRole = createRoleAndAssignPermissions(
        "ROLE_ADMIN",                           // Role name
        patientModule,                          // Module
        Set.of(Permission.CREATE,               // Permissions
                Permission.VIEW,
                Permission.EDIT,
                Permission.DELETE)
);

```

----------

### 3️⃣ SecurityConfig.java

**When it runs:** Application startup (after DataSeeder)

**Purpose:** Configures the entire security setup for the application

**Functions:**

#### `authenticationTokenFilterBean()`

```java

@Bean
public AuthTokenFilter authenticationTokenFilterBean()

```

**What it does:**

- Creates the JWT filter bean
- This filter will intercept every request

#### `defaultSecurityFilterChain()`

```java

@Bean
SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http)

```

**What it does:**

- Configures which URLs are public vs protected
- Adds JWT filter to the security chain
- Sets up OAuth2 login
- Configures CORS

**Configuration breakdown:**

**CSRF Disabled:**

```java
.csrf(AbstractHttpConfigurer::disable)

```

- Disables CSRF protection
- Safe for JWT-based APIs (stateless)

**Session Management:**

```java
.sessionManagement(sess ->
        sess.

sessionCreationPolicy(SessionCreationPolicy.STATELESS))

```

- Tells Spring to NOT create HTTP sessions
- Perfect for JWT (each request is independent)

**Public Endpoints:**

```java
.requestMatchers(
    "/api/auth/**",           // Login, signup
            "/api/v1/auth/**",        // Auth endpoints
            "/v3/api-docs/**",        // Swagger docs
            "/health",                // Health check
            "/oauth2/**"              // OAuth2 callbacks
).

permitAll()

```

- These URLs don't need authentication
- Anyone can access them

**Protected Endpoints:**

```java
.anyRequest().

authenticated()

```

- All other URLs require authentication

**JWT Filter Registration:**

```java
.addFilterBefore(authenticationTokenFilterBean(),

UsernamePasswordAuthenticationFilter .class)

```

- Adds JWT filter BEFORE Spring's default authentication filter
- This ensures JWT is checked first

**OAuth2 Configuration:**

```java
.oauth2Login(oauth ->oauth
        .

successHandler(oauth2SuccessHandler)
    .

redirectionEndpoint(endpoint ->
        endpoint.

baseUri("/login/oauth2/code/*")
    )
            )

```

- Configures OAuth2 login with Google/GitHub
- Sets success handler
- Sets redirect URL pattern

#### `corsConfigurationSource()`

```java

@Bean
public CorsConfigurationSource corsConfigurationSource()

```

**What it does:**

- Configures Cross-Origin Resource Sharing (CORS)
- Allows frontend (React/Angular) to call your API from different domain

**Configuration:**

```java
// Allowed origins (your frontend URLs)
.setAllowedOriginPatterns(Arrays.asList(
                                  "http://localhost:*",     // Local development
    "https://mydomain.com"    // Production
))

// Allowed HTTP methods
        .

setAllowedMethods(Arrays.asList(
        "GET", "POST","PUT","DELETE","OPTIONS"
))

// Allowed headers
        .

setAllowedHeaders(Arrays.asList(
                          "Authorization",   // For JWT token
    "Content-Type",    // For JSON
                          "X-Requested-With"
))

```

----------

### 4️⃣ AuthTokenFilter.java

**When it runs:** On EVERY incoming HTTP request (before reaching controller)

**Purpose:** Intercepts requests, validates JWT, sets up authentication

**Functions:**

#### `doFilterInternal()`

```java

@Override
protected void doFilterInternal(HttpServletRequest request,
                                HttpServletResponse response,
                                FilterChain filterChain)

```

**What it does:** Processes every request in 7 steps

**Step-by-step flow:**

**Step 1: Extract JWT from header**

```java
String jwt = parseJwt(request);

```

- Calls `parseJwt()` to get token from "Authorization" header

**Step 2: Validate JWT**

```java
if(jwt !=null&&jwtUtils.

validateJwtToken(jwt)){

```

- Checks if token exists
- Validates token using JwtUtils

**Step 3: Extract username**

```java
String username = jwtUtils.getUserNameFromJwtToken(jwt);

```

- Extracts username from JWT payload

**Step 4: Load user details**

```java
UserDetails userDetails = userDetailsService.loadUserByUsername(username);

```

- Loads complete user info from database
- Includes roles and permissions

**Step 5: Create authentication object**

```java
UsernamePasswordAuthenticationToken authentication =
        new UsernamePasswordAuthenticationToken(
                userDetails,           // Principal (user)
                null,                 // Credentials (not needed for JWT)
                userDetails.getAuthorities()  // Roles and permissions
        );

```

**Step 6: Add request details**

```java
authentication.setDetails(
    new WebAuthenticationDetailsSource().

buildDetails(request)
);

```

- Adds IP address, session ID to authentication

**Step 7: Set in SecurityContext**

```java
SecurityContextHolder.getContext().

setAuthentication(authentication);

```

- Stores authentication in thread-local storage
- Now Spring Security knows this request is authenticated

**Step 8: Continue filter chain**

```java
filterChain.doFilter(request, response);

```

- Passes request to next filter or controller

#### `parseJwt()`

```java
private String parseJwt(HttpServletRequest request)

```

**What it does:**

- Extracts JWT from "Authorization" header
- Removes "Bearer " prefix

**Example:**

```
Input:  "Bearer eyJhbGciOiJIUzI1NiIs..."
Output: "eyJhbGciOiJIUzI1NiIs..."

```

**Code:**

```java
String headerAuth = request.getHeader("Authorization");
if(StringUtils.

hasText(headerAuth) &&headerAuth.

startsWith("Bearer ")){
        return headerAuth.

substring(7);  // Remove "Bearer "
}
        return null;

```

----------

### 5️⃣ AuthEntryPointJwt.java

**When it runs:** When authentication fails (no token, invalid token, expired token)

**Purpose:** Returns consistent error response for unauthenticated requests

**Functions:**

#### `commence()`

```java

@Override
public void commence(HttpServletRequest request,
                     HttpServletResponse response,
                     AuthenticationException authException)

```

**What it does:** Returns 401 Unauthorized with JSON error

**Step-by-step flow:**

**Step 1: Log the attempt**

```java
String requestURI = request.getRequestURI();
logger.

error("Unauthorized access attempt - URI: {}",requestURI);

```

- Logs which endpoint user tried to access
- Useful for security monitoring

**Step 2: Set response headers**

```java
response.setContentType(MediaType.APPLICATION_JSON_VALUE);
response.

setStatus(HttpServletResponse.SC_UNAUTHORIZED);  // 401

```

**Step 3: Create error response**

```java
final Map<String, Object> body = new HashMap<>();
body.

put("status",401);
body.

put("error","Unauthorized");
body.

put("message","Authentication required to access this resource");
body.

put("path",requestURI);
body.

put("timestamp",Instant.now().

toString());

```

**Step 4: Send JSON response**

```java
final ObjectMapper mapper = new ObjectMapper();
mapper.

writeValue(response.getOutputStream(),body);

```

**Example response:**

```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Authentication required to access this resource",
  "path": "/api/v1/patients",
  "timestamp": "2024-01-15T10:30:45.123Z"
}

```

----------

### 6️⃣ JwtUtils.java

**When it runs:** During login (token generation) and every request (token validation)

**Purpose:** Handles all JWT operations (create, validate, extract data)

**Functions:**

#### `getJwtFromHeader()`

```java
public String getJwtFromHeader(HttpServletRequest request)

```

**What it does:**

- Extracts JWT from "Authorization: Bearer <token>" header
- Returns token or null

**Example:**

```java
// Request header: "Authorization: Bearer abc123xyz"
String token = getJwtFromHeader(request);
// Result: "abc123xyz"

```

#### `generateTokenFromUsername()`

```java
public String generateTokenFromUsername(String username)

```

**What it does:**

- Creates a new JWT token for a user
- Adds expiration time
- Signs with secret key

**⚠️ PROBLEM:** Currently hardcodes role as "Admin"

**Step-by-step:**

**Step 1: Validate input**

```java
if(!StringUtils.hasText(username)){
        throw new

IllegalArgumentException("Username cannot be empty");
}

```

**Step 2: Calculate expiration**

```java
Date issuedDate = new Date();
Date expirationDate = new Date(issuedDate.getTime() + Long.parseLong(expirationTimeMS));

```

**Step 3: Build JWT**

```java
return Jwts.builder()
    .

subject(username.trim())           // Who the token is for
        .

claim("roles","Admin")            // ❌ HARDCODED - BAD!
    .

issuedAt(issuedDate)              // When created
    .

expiration(expirationDate)        // When expires
    .

signWith(secureKey())             // Digital signature
        .

compact();                        // Create final token

```

**JWT Structure:**

```
Header:    {"alg":"HS256","typ":"JWT"}
Payload:   {"sub":"john@example.com","roles":"Admin","iat":1234567890,"exp":1234654290}
Signature: [digital signature]

```

#### `getUserNameFromJwtToken()`

```java
public String getUserNameFromJwtToken(String token)

```

**What it does:**

- Extracts username from JWT payload
- Validates signature first

**Step-by-step:**

**Step 1: Validate token not empty**

```java
if(!StringUtils.hasText(token)){
        throw new

IllegalArgumentException("Token cannot be empty");
}

```

**Step 2: Parse and extract**

```java
Claims claims = Jwts.parser()
        .verifyWith((SecretKey) secureKey())  // Verify signature
        .build()
        .parseSignedClaims(token.trim())      // Parse token
        .getPayload();                        // Get payload

return claims.

getSubject();               // Get username from "sub" claim

```

#### `validateJwtToken()`

```java
public boolean validateJwtToken(String token)

```

**What it does:**

- Validates JWT signature
- Checks expiration
- Handles all possible errors

**Returns:**

- `true` if token is valid
- `false` if invalid (logs reason)

**Validation checks:**

**1. Empty check:**

```java
if(!StringUtils.hasText(token)){
        throw new

IllegalArgumentException("Token cannot be empty");
}

```

**2. Parse and verify:**

```java
Jwts.parser()
    .

verifyWith((SecretKey) secureKey())  // Check signature
        .

build()
    .

parseSignedClaims(token.trim());     // Parse token

```

**3. Error handling:**

```java
catch(SecurityException ex){
        logger.

error("Invalid JWT signature");
}
        catch(
MalformedJwtException ex){
        logger.

error("Invalid JWT format");
}
        catch(
ExpiredJwtException ex){
        logger.

error("JWT token expired");
}
        catch(
UnsupportedJwtException ex){
        logger.

error("Unsupported JWT token");
}

```

#### `getExpirationFromToken()`

```java
public LocalDateTime getExpirationFromToken(String token)

```

**What it does:**

- Extracts expiration date from JWT
- Converts to LocalDateTime

**Used for:**

- Token blacklist (to know when to remove from blacklist)

#### `secureKey()` (Private Helper)

```java
private Key secureKey()

```

**What it does:**

- Converts Base64 secret to cryptographic key
- Used for signing and verifying JWTs

```java
return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));

```

----------

### 7️⃣ CustomUserDetailsService.java

**When it runs:** During JWT validation (loads user details)

**Purpose:** Loads user from database with all roles and permissions

**Functions:**

#### `loadUserByUsername()`

```java

@Override
@Cacheable(value = "userPermissions", key = "#username")
public UserDetails loadUserByUsername(String username)

```

**What it does:**

- Loads user from database
- Converts roles and permissions to Spring Security format
- Caches result for performance

**Step-by-step flow:**

**Step 1: Validate username**

```java
if(!StringUtils.hasText(username)){
        throw new

UsernameNotFoundException("Username cannot be null or empty");
}

```

**Step 2: Load user from database**

```java
User user = userRepository.findByUsernameWithAllPermissions(username.trim())
        .orElseThrow(() ->
                new UsernameNotFoundException("User not found: " + username.trim())
        );

```

**Step 3: Build authorities list**

```java
List<GrantedAuthority> authorities = new ArrayList<>();

```

**Step 4: Add role authorities**

```java
for(Role role :roles){
        authorities.

add(new SimpleGrantedAuthority(role.getRoleName()));
// Result: "ROLE_ADMIN", "ROLE_USER"

```

**Step 5: Add permission authorities**

```java
for(RolePermission rolePermission :role.

getRolePermissions()){
String moduleKey = rolePermission.getModule().getModuleKey();
    for(
Permission permissionAction :rolePermission.

getGrantedPermissions()){
String fullPermission = moduleKey + ":" + permissionAction.name();
        authorities.

add(new SimpleGrantedAuthority(fullPermission));
        }
        }
// Result: "PATIENT_MANAGEMENT:CREATE", "PATIENT_MANAGEMENT:VIEW"

```

**Step 6: Validate password exists**

```java
if(!StringUtils.hasText(user.getPassword())){
        throw new

UsernameNotFoundException("Local user has no password");
}

```

**Step 7: Return Spring Security UserDetails**

```java
return new org.springframework.security.core.userdetails.User(
        user.getUsername(),           // Username
    user.

getPassword(),           // Encoded password
    user.

isEnabled(),             // Account enabled?
    true,                         // Account not expired
            true,                         // Credentials not expired
            true,                         // Account not locked
authorities                   // All roles and permissions
);

```

**Caching:**

- Results are cached with key: username
- Next request for same user = instant (no database query)

----------

### 8️⃣ CustomPermissionService.java

**When it runs:** When @PreAuthorize checks permissions in controllers

**Purpose:** Checks if authenticated user has specific permission for a module

**Functions:**

#### `hasPermission()`

```java

@Cacheable(value = "userPermissions", key = "#authentication.name + '_' + #moduleKey + '_' + #permission")
public boolean hasPermission(Authentication authentication,
                             String moduleKey,
                             String permission)

```

**What it does:**

- Checks if user has permission for a module
- Returns true/false
- Cached for performance

**Parameters:**

- `authentication`: Current user's authentication object
- `moduleKey`: Module to check (e.g., "PATIENT_MANAGEMENT")
- `permission`: Permission to check (e.g., "CREATE", "VIEW")

**Step-by-step flow:**

**Step 1: Validate authentication**

```java
if(authentication ==null||!authentication.

isAuthenticated()){
        return false;  // Not logged in = no permission
        }

```

**Step 2: Get username**

```java
UserDetails userDetails = (UserDetails) authentication.getPrincipal();
String username = userDetails.getUsername();

```

**Step 3: Check for SUPER_ADMIN (bypass)**

```java
if(hasRole(userDetails.getAuthorities(), "SUPER_ADMIN")){
        log.

debug("User '{}' is a SUPER_ADMIN. Granting access.",username);
    return true;  // Super admins have all permissions
            }

```

**Step 4: Convert permission string to enum**

```java
Permission requiredPermission;
try{
requiredPermission =Permission.

valueOf(permission.toUpperCase());
        }catch(
IllegalArgumentException e){
        log.

warn("Invalid permission string '{}'",permission);
    return false;
            }

```

**Step 5: Load user with roles and permissions**

```java
User user = userRepository.findByUsernameWithRolesAndPermissions(username)
        .orElse(null);

if(user ==null){
        return false;
        }

```

**Step 6: Check permission using Java Streams**

```java
boolean isPermitted = user.getRoles().stream()
        // Get all RolePermission objects from all roles
        .flatMap(role -> role.getRolePermissions().stream())
        // Find match for module and permission
        .anyMatch(rolePermission ->
                rolePermission.getModule().getModuleKey().equalsIgnoreCase(moduleKey) &&
                        rolePermission.getGrantedPermissions().contains(requiredPermission)
        );

```

**How it works:**

```
User has roles: [ROLE_ADMIN]
↓
ROLE_ADMIN has permissions:
  - PATIENT_MANAGEMENT: [CREATE, VIEW, EDIT, DELETE]
  - USER_MANAGEMENT: [VIEW, EDIT]
↓
Check if user can CREATE in PATIENT_MANAGEMENT
↓
Stream through roles → Stream through permissions → Find match
↓
Result: TRUE (found PATIENT_MANAGEMENT:CREATE)

```

**Step 7: Return result**

```java
return isPermitted;

```

#### `hasRole()` (Private Helper)

```java
private boolean hasRole(Collection<? extends GrantedAuthority> authorities,
                        String roleName)

```

**What it does:**

- Checks if user has specific role
- Used for SUPER_ADMIN check

```java
return authorities.stream()
    .

anyMatch(authority ->authority.

getAuthority().

equals(roleName));

```

**Caching:**

- Cache key: "john@example.com_PATIENT_MANAGEMENT_CREATE"
- Same check again = instant result (no database query)

----------

### 9️⃣ TokenBlacklistService.java

**When it runs:** During logout and scheduled cleanup

**Purpose:** Manages list of invalidated (logged out) tokens

**Functions:**

#### `blacklistToken()`

```java
public void blacklistToken(String token, LocalDateTime expirationTime)

```

**What it does:**

- Adds token to blacklist map
- Stores expiration time

**When used:**

- User logs out
- Admin revokes token

**Example:**

```java
// User logs out at 2 PM, token expires at 6 PM
tokenBlacklistService.blacklistToken(jwtToken, LocalDateTime.of(2024, 1,15,18,0));

```

**Storage:**

```java
private final Map<String, LocalDateTime> blacklistedTokens = new ConcurrentHashMap<>();

// After adding:
// {"abc123xyz": "2024-01-15T18:00:00"}

```

**Overloaded version:**

```java
public void blacklistToken(String token)

```

- Uses default expiration (24 hours from now)

#### `isTokenBlacklisted()`

```java
public boolean isTokenBlacklisted(String token)

```

**What it does:**

- Checks if token is in blacklist
- Returns true if blacklisted

**Example:**

```java
if(tokenBlacklistService.isTokenBlacklisted(jwt)){
        throw new

AuthenticationException("Token has been revoked");
}

```

#### `removeExpiredTokens()`

```java

@Scheduled(fixedRate = 3600000)  // Every 1 hour
public void removeExpiredTokens()

```

**What it does:**

- Automatically removes expired tokens from blacklist
- Prevents memory leaks
- Runs every hour

**How it works:**

```java
LocalDateTime now = LocalDateTime.now();
AtomicInteger removedCount = new AtomicInteger(0);

blacklistedTokens.

entrySet().

removeIf(entry ->{
        if(entry.

getValue().

isBefore(now)){  // Expiration passed?
        removedCount.

incrementAndGet();
        return true;  // Remove this entry
                }
                return false;  // Keep this entry
                });

```

**Example:**

```
Blacklist at 6 PM:
- Token A expires at 5 PM ❌ REMOVE
- Token B expires at 7 PM ✅ KEEP
- Token C expires at 4 PM ❌ REMOVE

After cleanup:
- Token B expires at 7 PM ✅

```

#### `clearAllTokens()`

```java
public void clearAllTokens()

```

**What it does:**

- Removes ALL tokens from blacklist
- **Use with caution** - administrative use only

#### `getBlacklistSize()`

```java
public int getBlacklistSize()

```

**What it does:**

- Returns number of tokens currently blacklisted
- Useful for monitoring

#### `getTokenExpirationTime()`

```java
public LocalDateTime getTokenExpirationTime(String token)

```

**What it does:**

- Returns when a specific blacklisted token expires
- Returns null if token not in blacklist

----------

### 🔟 Oauth2SuccessHandler.java

**When it runs:** After successful OAuth2 login (Google/GitHub)

**Purpose:** Processes OAuth2 login and generates JWT

**Functions:**

#### `onAuthenticationSuccess()`

```java

@Override
public void onAuthenticationSuccess(HttpServletRequest request,
                                    HttpServletResponse response,
                                    Authentication authentication)

```

**What it does:**

- Receives OAuth2 user data
- Processes/creates user in database
- Generates JWT
- Returns response

**Step-by-step flow:**

**Step 1: Cast to OAuth2 authentication**

```java
OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
OAuth2User user = oauthToken.getPrincipal();

```

**Step 2: Get provider (Google/GitHub)**

```java
String registrationId = oauthToken.getAuthorizedClientRegistrationId();
// Result: "google" or "github"

```

**Step 3: Process OAuth2 user**

```java
ResponseEntity<UserInfoResponse> oauthLoginResponse =
        oAuth2UserProcessingService.handleOauth2loginRequest(user, registrationId);

```

This does:

- Extracts email, name from OAuth2 user
- Checks if user exists in database
- Creates new user if needed
- Generates JWT token

**Step 4: Set response**

```java
response.setStatus(oauthLoginResponse.getStatusCode().

value());
        response.

setContentType(MediaType.APPLICATION_JSON_VALUE);

```

**Step 5: Write JSON response**

```java
response.getWriter().

write(
        objectMapper.writeValueAsString(oauthLoginResponse.getBody())
        );

```

**Example response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "username": "john@gmail.com",
  "roles": [
    "ROLE_USER"
  ],
  "message": "Login successful"
}

```

----------

### 1️⃣1️⃣ Oauth2Utils.java

**When it runs:** During OAuth2 login processing

**Purpose:** Utility methods to extract data from OAuth2 providers

**Functions:**

#### `getOauthProvider()`

```java
public AuthProviderType getOauthProvider(String registrationId)

```

**What it does:**

- Converts provider string to enum
- Validates provider

**Example:**

```java
AuthProviderType provider = oauth2Utils.getOauthProvider("google");
// Result: AuthProviderType.GOOGLE

AuthProviderType provider = oauth2Utils.getOauthProvider("facebook");
// Result: IllegalArgumentException (not supported)

```

**Supported providers:**

```java
return switch(registrationId.toLowerCase()){
        case"google"->AuthProviderType.GOOGLE;
    case"github"->AuthProviderType.GITHUB;
default ->throw new

IllegalArgumentException("Invalid provider");
};

```

#### `determineProviderIdFromOauth2user()`

```java
public String determineProviderIdFromOauth2user(OAuth2User oAuth2User,
                                                String registrationId)

```

**What it does:**

- Extracts unique user ID from OAuth2 provider
- Different providers have different ID fields

**How it works:**

```java
return switch(registrationId.toLowerCase()){
        case"google"->oAuth2User.

getAttribute("sub");  // Google's user ID field
    case"github"->Objects.

toString(oAuth2User.getAttribute("id"), null);  // GitHub's ID
default ->throw new

IllegalArgumentException("Invalid provider");
};

```

**Example OAuth2 data:**

**Google:**

```json
{
  "sub": "110169484474386276334",
  ←
  Provider
  ID
  "email": "john@gmail.com",
  "name": "John Doe"
}

```

**GitHub:**

```json
{
  "id": 12345678,
  ←
  Provider
  ID
  "login": "johndoe",
  "email": "john@github.com"
}

```

#### `determineUsernameFromOauth2user()`

```java
public String determineUsernameFromOauth2user(OAuth2User oAuth2User,
                                              String registrationId,
                                              String providerId)

```

**What it does:**

- Determines username to use in our system
- Priority: email > provider-specific username > provider ID

**Logic:**

```java
String email = oAuth2User.getAttribute("email");
if(email !=null&&!email.

isBlank()){
        return email;  // Use email if available
}

// Fallback to provider-specific username
        return switch(registrationId.

toLowerCase()){
        case"google"->oAuth2User.

getAttribute("sub");
    case"github"->oAuth2User.

getAttribute("login");

default ->providerId;  // Last resort: use provider ID
};

```

**Example:**

```
Google user with email: john@gmail.com
→ Username: john@gmail.com

GitHub user without email but with login: johndoe
→ Username: johndoe

GitHub user without email or login
→ Username: 12345678 (provider ID)

```

----------

## 🔄 Complete Authentication Flow

### Flow 1: User Signup (Local Registration)

```
Step 1: User sends POST /api/auth/signup
{
  "username": "john@example.com",
  "password": "SecurePass123",
  "email": "john@example.com"
}

↓

Step 2: Controller receives request
- Validates input
- Checks if username exists

↓

Step 3: ApplicationConfig.passwordEncoder() encodes password
Input:  "SecurePass123"
Output: "$2a$10$N9qo8uLOickgx2ZMRZoMye..."

↓

Step 4: Create User entity
User user = new User();
user.setUsername("john@example.com");
user.setPassword(encodedPassword);
user.setRoles(Set.of(userRole));  // ROLE_USER from DataSeeder

↓

Step 5: Save to database
userRepository.save(user);

↓

Step 6: Return success response
{
  "message": "User registered successfully",
  "username": "john@example.com"
}

```

----------

### Flow 2: User Login (Local Authentication)

```
Step 1: User sends POST /api/auth/login
{
  "username": "john@example.com",
  "password": "SecurePass123"
}

↓

Step 2: AuthenticationManager validates credentials
- Loads user from database via CustomUserDetailsService
- Compares hashed passwords using BCrypt
- Checks if account is enabled

↓

Step 3: CustomUserDetailsService.loadUserByUsername() runs
- Loads user from database
- Loads all roles: ["ROLE_USER"]
- Loads all permissions: ["PATIENT_MANAGEMENT:VIEW"]
- Returns UserDetails object

↓

Step 4: Authentication successful
Authentication auth = authenticationManager.authenticate(
    new UsernamePasswordAuthenticationToken(username, password)
);

↓

Step 5: JwtUtils.generateTokenFromUsername() creates JWT
- Subject: "john@example.com"
- Issued at: 2024-01-15T10:00:00
- Expires at: 2024-01-16T10:00:00 (24 hours later)
- Signature: [signed with secret key]

↓

Step 6: Return JWT to client
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "username": "john@example.com",
  "roles": ["ROLE_USER"]
}

↓

Step 7: Client stores JWT
- In localStorage, sessionStorage, or memory
- Sends in Authorization header for future requests

```

----------

### Flow 3: Accessing Protected Endpoint

```
Step 1: Client sends request with JWT
GET /api/v1/patients/123
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

↓

Step 2: SecurityConfig filter chain activates
Request enters security filter chain

↓

Step 3: AuthTokenFilter.doFilterInternal() intercepts
┌─────────────────────────────────────────┐
│ 3a. parseJwt(request)                   │
│     Extracts: "eyJhbGciOiJIUzI1NiIs..." │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 3b. jwtUtils.validateJwtToken(jwt)     │
│     - Checks signature ✓                │
│     - Checks expiration ✓               │
│     - Returns: true                     │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 3c. jwtUtils.getUserNameFromJwtToken() │
│     Returns: "john@example.com"         │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 3d. loadUserByUsername()                │
│     Loads user with roles/permissions   │
│     Authorities: ["ROLE_USER",          │
│                   "PATIENT_MGMT:VIEW"]  │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 3e. Create Authentication object        │
│     UsernamePasswordAuthenticationToken │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 3f. SecurityContextHolder.setContext() │
│     User is now authenticated!          │
└─────────────────────────────────────────┘

↓

Step 4: Request reaches Controller
@GetMapping("/{id}")
@PreAuthorize("@permissionService.hasPermission(authentication, 'PATIENT_MANAGEMENT', 'VIEW')")
public Patient getPatient(@PathVariable Long id)

↓

Step 5: @PreAuthorize triggers permission check
┌─────────────────────────────────────────┐
│ CustomPermissionService.hasPermission() │
│                                         │
│ Parameters:                             │
│ - authentication: [john@example.com]    │
│ - moduleKey: "PATIENT_MANAGEMENT"       │
│ - permission: "VIEW"                    │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ Check 1: Is user SUPER_ADMIN?          │
│ Result: No                              │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ Check 2: Load user roles & permissions │
│                                         │
│ User: john@example.com                  │
│ Roles: [ROLE_USER]                      │
│ Permissions:                            │
│   PATIENT_MANAGEMENT: [VIEW]            │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ Check 3: Stream through permissions     │
│                                         │
│ Looking for:                            │
│   Module: PATIENT_MANAGEMENT            │
│   Permission: VIEW                      │
│                                         │
│ Found: YES ✓                            │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ Result: true                            │
│ Access GRANTED                          │
└─────────────────────────────────────────┘

↓

Step 6: Controller method executes
public Patient getPatient(@PathVariable Long id) {
    return patientService.findById(id);
}

↓

Step 7: Return response to client
{
  "id": 123,
  "name": "Jane Doe",
  "age": 45,
  "diagnosis": "Hypertension"
}

```

----------

### Flow 4: Permission Denied Scenario

```
Step 1: User tries to DELETE patient
DELETE /api/v1/patients/123
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

↓

Step 2-3: AuthTokenFilter validates JWT (same as Flow 3)
User authenticated: john@example.com

↓

Step 4: Request reaches Controller
@DeleteMapping("/{id}")
@PreAuthorize("@permissionService.hasPermission(authentication, 'PATIENT_MANAGEMENT', 'DELETE')")
public void deletePatient(@PathVariable Long id)

↓

Step 5: Permission check
┌─────────────────────────────────────────┐
│ CustomPermissionService.hasPermission() │
│                                         │
│ Looking for:                            │
│   Module: PATIENT_MANAGEMENT            │
│   Permission: DELETE                    │
│                                         │
│ User has:                               │
│   PATIENT_MANAGEMENT: [VIEW]            │
│                                         │
│ Found: NO ✗                             │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ Result: false                           │
│ Access DENIED                           │
└─────────────────────────────────────────┘

↓

Step 6: Spring Security throws AccessDeniedException

↓

Step 7: Return 403 Forbidden
{
  "status": 403,
  "error": "Forbidden",
  "message": "Access denied"
}

```

----------

### Flow 5: Invalid/Expired Token

```
Step 1: Client sends request with expired JWT
GET /api/v1/patients
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs... (EXPIRED)

↓

Step 2: AuthTokenFilter.doFilterInternal()
String jwt = parseJwt(request);
// jwt = "eyJhbGciOiJIUzI1NiIs..."

↓

Step 3: JwtUtils.validateJwtToken(jwt)
try {
    Jwts.parser()
        .verifyWith(secretKey)
        .build()
        .parseSignedClaims(jwt);
} catch (ExpiredJwtException ex) {
    logger.error("JWT token expired");
    return false;  // ← Validation fails
}

↓

Step 4: Authentication NOT set
// SecurityContext remains empty
// User is considered unauthenticated

↓

Step 5: Request continues to Controller
// But user is not authenticated

↓

Step 6: SecurityConfig.authorizeHttpRequests() checks
.anyRequest().authenticated()  // ← This fails

↓

Step 7: AuthEntryPointJwt.commence() triggered
- Logs unauthorized attempt
- Builds error response
- Returns 401 Unauthorized

↓

Step 8: Client receives error
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Authentication required to access this resource",
  "path": "/api/v1/patients",
  "timestamp": "2024-01-15T10:30:45.123Z"
}

```

----------

### Flow 6: User Logout

```
Step 1: Client sends logout request
POST /api/auth/logout
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

↓

Step 2: AuthTokenFilter validates JWT (normal flow)
User authenticated: john@example.com

↓

Step 3: Logout Controller method
@PostMapping("/logout")
public ResponseEntity<?> logout(@RequestHeader("Authorization") String authHeader) {
    String jwt = authHeader.substring(7);  // Remove "Bearer "
    
    // Extract expiration from token
    LocalDateTime expiration = jwtUtils.getExpirationFromToken(jwt);
    
    // Add to blacklist
    tokenBlacklistService.blacklistToken(jwt, expiration);
    
    return ResponseEntity.ok("Logged out successfully");
}

↓

Step 4: Token added to blacklist
blacklistedTokens.put(
    "eyJhbGciOiJIUzI1NiIs...",
    LocalDateTime.of(2024, 1, 16, 10, 0)  // Expires tomorrow
);

↓

Step 5: Client receives success response
{
  "message": "Logged out successfully"
}

↓

Step 6: Client deletes JWT from storage
localStorage.removeItem('token');

↓

Step 7: Future requests with this token
⚠️ NOTE: Blacklist check is currently COMMENTED OUT in AuthTokenFilter
// if (jwt != null && jwtUtils.validateJwtToken(jwt) 
//     && !tokenBlacklistService.isTokenBlacklisted(jwt)) {

To fully enable logout:
1. Uncomment blacklist check in AuthTokenFilter
2. Add blacklist injection:
   @Autowired
   private TokenBlacklistService tokenBlacklistService;

```

----------

### Flow 7: OAuth2 Login (Google)

```
Step 1: User clicks "Login with Google" on frontend
<a href="/oauth2/authorization/google">
    Login with Google
</a>

↓

Step 2: Spring Security redirects to Google
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=http://localhost:8080/login/oauth2/code/google&
  response_type=code&
  scope=openid%20email%20profile

↓

Step 3: User logs in at Google
- Enters Google credentials
- Grants permissions

↓

Step 4: Google redirects back with code
http://localhost:8080/login/oauth2/code/google?code=4/0AY0e...

↓

Step 5: Spring Security exchanges code for token
- Calls Google's token endpoint
- Receives access token and ID token

↓

Step 6: Spring Security loads user info
GET https://www.googleapis.com/oauth2/v3/userinfo
Response:
{
  "sub": "110169484474386276334",
  "email": "john@gmail.com",
  "name": "John Doe",
  "picture": "https://..."
}

↓

Step 7: Oauth2SuccessHandler.onAuthenticationSuccess()
┌─────────────────────────────────────────┐
│ 7a. Extract OAuth2User data            │
│     email: john@gmail.com               │
│     name: John Doe                      │
│     sub: 110169484474386276334          │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 7b. Get registration ID                 │
│     registrationId: "google"            │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 7c. Oauth2Utils.getOauthProvider()     │
│     Returns: AuthProviderType.GOOGLE    │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 7d. determineProviderIdFromOauth2user() │
│     Returns: "110169484474386276334"    │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 7e. determineUsernameFromOauth2user()   │
│     Returns: "john@gmail.com"           │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 7f. Check if user exists in database    │
│     Query: SELECT * FROM users          │
│            WHERE username = ?           │
│            AND provider = 'GOOGLE'      │
│            AND provider_id = ?          │
└─────────────────────────────────────────┘
         ↓
    ┌────┴────┐
    │ Exists? │
    └────┬────┘
         │
    ┌────┴────┐
    │         │
  [YES]     [NO]
    │         │
    │         ↓
    │    ┌─────────────────────────────────┐
    │    │ Create new user:                │
    │    │ - username: john@gmail.com      │
    │    │ - provider: GOOGLE              │
    │    │ - providerId: 110169...         │
    │    │ - roles: [ROLE_USER]            │
    │    │ - enabled: true                 │
    │    │ - password: null (OAuth only)   │
    │    └─────────────────────────────────┘
    │         │
    └────┬────┘
         ↓
┌─────────────────────────────────────────┐
│ 7g. JwtUtils.generateTokenFromUsername()│
│     Creates JWT for john@gmail.com      │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 7h. Build response                      │
│     {                                   │
│       "token": "eyJhbGci...",           │
│       "username": "john@gmail.com",     │
│       "provider": "GOOGLE",             │
│       "roles": ["ROLE_USER"]            │
│     }                                   │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 7i. Write JSON response                 │
│     Status: 200 OK                      │
└─────────────────────────────────────────┘

↓

Step 8: Frontend receives JWT
- Stores token
- Redirects to dashboard

```

----------

## 📋 Quick Reference Guide

### Common Operations

#### 1. Check if JWT is valid

```java
boolean isValid = jwtUtils.validateJwtToken(token);

```

#### 2. Get username from JWT

```java
String username = jwtUtils.getUserNameFromJwtToken(token);

```

#### 3. Generate new JWT

```java
String token = jwtUtils.generateTokenFromUsername(username);

```

#### 4. Blacklist token (logout)

```java
LocalDateTime expiration = jwtUtils.getExpirationFromToken(token);
tokenBlacklistService.

blacklistToken(token, expiration);

```

#### 5. Check permission in controller

```java

@PreAuthorize("@permissionService.hasPermission(authentication, 'PATIENT_MANAGEMENT', 'CREATE')")
public Patient createPatient(@RequestBody Patient patient) {
    // Method only executes if user has CREATE permission
}

```

#### 6. Get current authenticated user

```java

@GetMapping("/me")
public User getCurrentUser(Authentication authentication) {
    String username = authentication.getName();
    return userService.findByUsername(username);
}

```

----------

### Configuration Files Needed

#### application.properties

```properties
# JWT Configuration
spring.app.jwtSecret=YOUR_BASE64_ENCODED_SECRET_KEY_HERE_AT_LEAST_256_BITS
spring.app.expirationTimeMS=86400000
spring.app.cookieName=jwt_token
# Token Blacklist
app.jwt.expiration-hours=24
# OAuth2 - Google
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
spring.security.oauth2.client.registration.google.scope=openid,email,profile
spring.security.oauth2.client.registration.google.redirect-uri={baseUrl}/login/oauth2/code/google
# OAuth2 - GitHub
spring.security.oauth2.client.registration.github.client-id=YOUR_GITHUB_CLIENT_ID
spring.security.oauth2.client.registration.github.client-secret=YOUR_GITHUB_CLIENT_SECRET
spring.security.oauth2.client.registration.github.scope=read:user,user:email
spring.security.oauth2.client.registration.github.redirect-uri={baseUrl}/login/oauth2/code/github

```

----------

### Security Best Practices

#### ✅ DO:

1. **Use strong secret keys** (at least 256 bits, Base64 encoded)
2. **Set short token expiration** (15-30 minutes for access tokens)
3. **Implement refresh tokens** for better UX
4. **Enable token blacklist** for logout functionality
5. **Use HTTPS in production**
6. **Validate all inputs**
7. **Log security events**
8. **Cache permission checks** for performance
9. **Use @Transactional(readOnly=true)** for read operations

#### ❌ DON'T:

1. **Don't hardcode roles** in JWT generation (current issue!)
2. **Don't store sensitive data** in JWT payload
3. **Don't expose secret keys** through public methods
4. **Don't skip token validation**
5. **Don't trust client-side data**
6. **Don't log sensitive information** (tokens, passwords)
7. **Don't use GET for logout** (should be POST)
8. **Don't forget rate limiting**

----------

### Testing Checklist

#### Authentication Tests:

-   [ ] Valid login returns JWT
-   [ ] Invalid credentials return 401
-   [ ] Missing credentials return 401
-   [ ] Disabled user cannot login
-   [ ] OAuth2 login creates/finds user
-   [ ] OAuth2 login generates JWT

#### Authorization Tests:

-   [ ] Valid JWT grants access
-   [ ] Expired JWT returns 401
-   [ ] Invalid JWT returns 401
-   [ ] Missing JWT returns 401
-   [ ] Blacklisted JWT returns 401 (if enabled)
-   [ ] User with permission can access endpoint
-   [ ] User without permission gets 403
-   [ ] SUPER_ADMIN bypasses permission checks

#### Security Tests:

-   [ ] Password is hashed in database
-   [ ] JWT signature cannot be forged
-   [ ] Token blacklist prevents reuse
-   [ ] CORS allows only configured origins
-   [ ] Public endpoints accessible without token
-   [ ] Private endpoints reject without token

----------

## 🐛 Current Issues to Fix

### 1. CRITICAL: Hardcoded Role in JWT

**File:** JwtUtils.java, line in `generateTokenFromUsername()`

**Current code:**

```java
.claim("roles","Admin")  // ❌ Wrong!

```

**Fix:**

```java
public String generateTokenFromUsername(String username,
                                        Collection<? extends GrantedAuthority> authorities) {
    List<String> roles = authorities.stream()
            .map(GrantedAuthority::getAuthority)
            .filter(auth -> auth.startsWith("ROLE_"))
            .collect(Collectors.toList());

    return Jwts.builder()
            .subject(username.trim())
            .claim("roles", roles)  // ✅ Dynamic roles
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationTimeMs))
            .signWith(secureKey())
            .compact();
}

```

### 2. Token Blacklist Not Enabled

**File:** AuthTokenFilter.java

**Current:** Blacklist check is commented out

**Fix:** Uncomment and inject service:

```java

@Autowired
private TokenBlacklistService tokenBlacklistService;

// In doFilterInternal():
if(jwt !=null&&jwtUtils.

validateJwtToken(jwt) 
    &&!tokenBlacklistService.

isTokenBlacklisted(jwt)){
        // Authenticate user
        }

```

### 3. Missing Refresh Token

**Recommendation:** Implement refresh token flow

- Short-lived access tokens (15 mins)
- Long-lived refresh tokens (7 days)
- Separate endpoint: POST /api/auth/refresh

### 4. Data Type Issue

**File:** JwtUtils.java

**Current:**

```java

@Value("${spring.app.expirationTimeMS}")
private String expirationTimeMS;  // String for numeric value

```

**Fix:**

```java

@Value("${spring.app.expirationTimeMS}")
private long expirationTimeMs;  // Use long

```

----------

## 🎓 Summary

This JWT security system provides:

1. **Stateless Authentication** via JWT tokens
2. **Role-Based Access Control** (RBAC) with dynamic permissions
3. **OAuth2 Integration** for social login
4. **Token Blacklisting** for secure logout
5. **Centralized Permission Management** via database

**Files execute in this order:**

1. ApplicationConfig → Creates beans
2. DataSeeder → Seeds data
3. SecurityConfig → Configures security
4. AuthTokenFilter → Validates every request
5. JwtUtils → Handles JWT operations
6. CustomUserDetailsService → Loads user data
7. CustomPermissionService → Checks permissions
8. AuthEntryPointJwt → Handles errors
9. OAuth2 components → Handle social login
10. TokenBlacklistService → Manages logout

**Remember:** Fix the hardcoded "Admin" role before going to production!