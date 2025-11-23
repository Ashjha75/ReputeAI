
---

# 📚 Part 1: The Theory (From Basic to Advanced)

Before coding, it is crucial to understand the "Why" and "How" of this architecture.

## 1. The Basics: Concepts & Terminology

### A. Authentication vs. Authorization

* **Authentication (Who are you?):** Verifying identity (e.g., logging in with a password).
* **Authorization (What can you do?):** Verifying permissions (e.g., admin access, read-only access).

### B. What is OAuth2?

OAuth2 is a protocol that allows a user to grant a third-party application access to their resources on another
service (like Google or GitHub) **without sharing their password**.

* **Analogy:** You use a "Valet Key" for your car. It starts the car (Access), but it doesn't open the trunk or
  glovebox (Restricted Scope). You didn't give the valet your master key.

### C. What is OpenID Connect (OIDC)?

OAuth2 is for *authorization* (accessing data). OIDC sits on top of OAuth2 to handle *authentication* (logging in). When
you use "Sign in with Google," you are using OIDC.

### D. What is JWT (JSON Web Token)?

A JWT is a compact, URL-safe means of representing claims to be transferred between two parties.

* **Structure:** `Header.Payload.Signature`
* **Stateless:** The server does not store session data in memory. The token itself contains the user data and
  expiration. If the signature is valid, the token is valid.

---

## 2. The Architecture: The Hybrid Flow

In this stack, we combine OAuth2 with local JWTs. This is the industry-standard flow for Single Page Applications (
React/Angular/Vue) + Spring Boot.

1. **Client:** User clicks "Login with Google".
2. **Spring Boot:** Redirects user to Google's Authorization Server.
3. **Google:** User signs in and consents. Google redirects back to Spring Boot with an **Authorization Code**.
4. **Spring Boot:** Exchanges the code for an **ID Token** and **Access Token** from Google (back-channel
   communication).
5. **Spring Boot (The Bridge):**
    * Reads the user's email from Google's token.
    * Checks if the user exists in the local MySQL database. If not, it registers them.
    * **Crucial Step:** Spring generates its **own internal JWT** for this user.
6. **Spring Boot:** Redirects the user back to the Frontend (e.g., `localhost:3000`) with the internal JWT appended to
   the URL (or set in a cookie).
7. **Client:** Frontend stores the JWT and sends it in the `Authorization: Bearer` header for all future API requests.

---

## 3. Advanced Concepts & Best Practices

### A. Why generate our own JWT instead of using Google's?

* **Control:** Google's token allows access to *Google's* APIs (Gmail, Drive). Your internal JWT controls access to
  *your* Banking/ToDo/Shop API.
* **Session Management:** You define how long your user stays logged in, independent of Google.
* **Roles:** You can add custom roles (e.g., `ROLE_ADMIN`) to your internal JWT that Google knows nothing about.

### B. Security Considerations

* **Signature:** JWTs are signed with a `Secret Key`. If an attacker changes the payload (e.g., `isAdmin: true`), the
  signature breaks.
* **HTTPS:** OAuth2 and JWTs must strictly run over HTTPS to prevent token interception.
* **CSRF (Cross-Site Request Forgery):** In a stateless JWT architecture, we usually disable CSRF because the browser
  doesn't automatically include auth headers like it does with cookies. However, if you store JWTs in `HttpOnly`
  cookies, you **must** enable CSRF protection.

---

# 💻 Part 2: The Backend Implementation

Here is the clean, stripped-down code focusing only on what matters.

### 1. Project Dependencies (`pom.xml`)

```xml

<dependencies>
    <!-- Core Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!-- Security & OAuth -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-oauth2-client</artifactId>
    </dependency>
    <!-- Database -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>
    <!-- JWT Library -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.11.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>
    <!-- Utils -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

### 2. Application Configuration (`application.properties`)

```properties
spring.application.name=auth-service
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/auth_db
spring.datasource.username=root
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=update
# Google OAuth2
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_SECRET
spring.security.oauth2.client.registration.google.scope=email,profile
# GitHub OAuth2
spring.security.oauth2.client.registration.github.client-id=YOUR_GITHUB_ID
spring.security.oauth2.client.registration.github.client-secret=YOUR_GITHUB_SECRET
spring.security.oauth2.client.registration.github.scope=user:email,read:user
# JWT Config (Secret must be 32+ chars)
app.jwt.secret=9a4f2c8d3b7a1e6f45c8a0b3f2e1d9c8
app.jwt.expiration-ms=86400000 
app.frontend.url=http://localhost:3000/oauth2/redirect
```

### 3. Domain Layer (Model & Repo)

**`model/User.java`**

```java
package com.app.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    private String name;
    private String imageUrl;

    // Helps distinguish how they logged in
    @Enumerated(EnumType.STRING)
    private AuthProvider provider;

    private String providerId; // ID from Google/Github
}
```

**`model/AuthProvider.java`**

```java
package com.app.model;

public enum AuthProvider {LOCAL, GOOGLE, GITHUB}
```

**`repository/UserRepository.java`**

```java
package com.app.repository;

import com.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
```

### 4. Security Layer (JWT Handling)

**`security/JwtUtils.java`**

```java
package com.app.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private int jwtExpirationMs;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // 1. Generate Token
    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // 2. Get Email from Token
    public String getEmailFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // 3. Validate Token
    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}
```

**`security/JwtAuthFilter.java`**
*This filter intercepts every request to check for a valid JWT.*

```java
package com.app.security;

import com.app.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String token = null;
        String email = null;

        // 1. Check for Bearer Token
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            if (jwtUtils.validateToken(token)) {
                email = jwtUtils.getEmailFromToken(token);
            }
        }

        // 2. If valid and not already authenticated, set SecurityContext
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            var dbUser = userRepository.findByEmail(email).orElse(null);

            if (dbUser != null) {
                UserDetails userDetails = new User(dbUser.getEmail(), "", Collections.emptyList());
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
```

### 5. The Bridge (OAuth2 Success Handler)

*This is where the magic happens. It translates Google's auth into your JWT.*

**`security/OAuth2LoginSuccessHandler.java`**

```java
package com.app.security;

import com.app.model.AuthProvider;
import com.app.model.User;
import com.app.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2AuthenticationToken authToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = authToken.getPrincipal();
        String registrationId = authToken.getAuthorizedClientRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        // 1. Extract Info
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String imageUrl = "";

        // Handle Provider Differences
        if ("github".equals(registrationId)) {
            imageUrl = (String) attributes.get("avatar_url");
            // Note: If email is private in GitHub, this might be null. 
            // In a real app, you need a secondary API call to GitHub to fetch private email.
        } else {
            imageUrl = (String) attributes.get("picture");
        }

        // 2. Save or Update User
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .email(email)
                    .name(name)
                    .imageUrl(imageUrl)
                    .provider(AuthProvider.valueOf(registrationId.toUpperCase()))
                    .build();
            return userRepository.save(newUser);
        });

        // 3. Generate Internal JWT
        String token = jwtUtils.generateToken(user.getEmail());

        // 4. Redirect to Frontend with Token
        getRedirectStrategy().sendRedirect(request, response, frontendUrl + "?token=" + token);
    }
}
```

### 6. Main Configuration

**`config/SecurityConfig.java`**

```java
package com.app.config;

import com.app.security.JwtAuthFilter;
import com.app.security.OAuth2LoginSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF because we are using stateless JWTs
                .csrf(AbstractHttpConfigurer::disable)

                // Public vs Protected Routes
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/login/**", "/oauth2/**").permitAll()
                        .anyRequest().authenticated()
                )

                // Stateless Session (No JSESSIONID)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // OAuth2 Setup
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2LoginSuccessHandler)
                )

                // Add JWT Filter before standard authentication
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

### 7. Controller

**`controller/DemoController.java`**

```java
package com.app.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demo")
public class DemoController {

    @GetMapping("/protected")
    public ResponseEntity<String> protectedEndpoint() {
        return ResponseEntity.ok("If you see this, your JWT is valid!");
    }
}
```

---

# 🚀 Part 3: How to Run It

1. **Google Cloud Console:** Create a project -> API & Services -> Credentials -> Create OAuth Client ID (Web
   Application).
    * **Redirect URI:** `http://localhost:8080/login/oauth2/code/google`
2. **GitHub Developer Settings:** OAuth Apps -> New OAuth App.
    * **Callback URL:** `http://localhost:8080/login/oauth2/code/github`
3. **Application Properties:** Paste your Client IDs and Secrets into `application.properties`.
4. **Run Spring Boot.**
5. **Test in Browser:**
    * Go to: `http://localhost:8080/oauth2/authorization/google`
    * Log in with Google.
    * You will be redirected to: `http://localhost:3000/oauth2/redirect?token=eyJhbGciOi...`
6. **Test API:**
    * Copy that token.
    * Send GET Request to `http://localhost:8080/api/demo/protected` with Header `Authorization: Bearer <your_token>`.

# Diagram

``` markdown
┌─────────────┐                                  ┌──────────────┐
│   User      │                                  │   Google     │
│  (Browser)  │                                  │   Server     │
└──────┬──────┘                                  └──────┬───────┘
│                                                │
│ 1. Click "Login with Google"                   │
│───────────────────────────────────────────▶    │
│                                                │
│ 2. Redirect to Google login (auth request)     │
│◀───────────────────────────────────────────    │
│                                                │
│ 3. User enters Google credentials              │
│───────────────────────────────────────────▶    │
│                                                │
│ 4. Google asks: "Allow app access?"            │
│◀───────────────────────────────────────────    │
│                                                │
│ 5. User clicks "Allow"                         │
│───────────────────────────────────────────▶    │
│                                                │
│ 6. Redirect to app with code (to frontend URL) │
│◀───────────────────────────────────────────    │
│                                                │
┌──────▼──────┐                                  ┌──────▼───────┐
│  Your App   │                                  │   Google     │
│   Backend   │                                  │   Server     │
└──────┬──────┘                                  └──────┬───────┘
│                                                │
│ 7. Backend receives code (from frontend)       │
│───────────────────────────────────────────▶    │
│   (server-side)                                │
│                                                │
│ 8. Exchange code for access token              │
│───────────────────────────────────────────▶    │
│                                                │
│ 9. Google returns access token / id_token      │
│◀───────────────────────────────────────────    │
│                                                │
│10. Backend uses token to fetch user info       │
│───────────────────────────────────────────▶    │
│                                                │
│11. Google returns user data (email, name, etc) │
│◀───────────────────────────────────────────    │
│                                                │
│12. Create / update user in DB                  │
│                                                │
│13. Generate JWT / session                      │
│                                                │
┌──────▼──────┐                                  │       
│   User      │                                  │      
│  (Browser)  │                                  │       
└──────┬──────┘                                  │       
│                                                │ 
│14. Backend sets HttpOnly cookie or returns token│
│    (do NOT place token in URL)                 │
│◀───────────────────────────────────────────    │ 
│                                                │ 
│15. Redirect to frontend route (no JWT in URL)  │ 
│───────────────────────────────────────────▶    │  
│                                                │ 
│16. User logged in!                             │ 
│                                                │
```

---

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Angular)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Login Page   │  │ Dashboard    │  │ Profile Page │          │
│  │              │  │              │  │              │          │
│  │ [Login Form] │  │ [Protected]  │  │ [Protected]  │          │
│  │ [Google Btn] │  │              │  │              │          │
│  │ [GitHub Btn] │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP Requests
                              │ JWT in Cookie/Header
┌─────────────────────────────▼───────────────────────────────────┐
│                    SPRING BOOT BACKEND                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              SecurityFilterChain                          │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  1. JwtAuthenticationFilter                        │  │  │
│  │  │     • Extract JWT from cookie/header               │  │  │
│  │  │     • Validate JWT signature                       │  │  │
│  │  │     • Set SecurityContext                          │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                           ↓                               │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  2. OAuth2LoginFilter                              │  │  │
│  │  │     • Handle OAuth2 callbacks                      │  │  │
│  │  │     • Exchange code for token                      │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                           ↓                               │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  3. Controllers                                     │  │  │
│  │  │     • AuthController (/api/v1/auth/**)             │  │  │
│  │  │     • UserController (/api/v1/users/**)            │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Service Layer                           │  │
│  │  ┌─────────────────┐  ┌──────────────────────────────┐  │  │
│  │  │  AuthService    │  │  OAuth2 Success Handler       │  │  │
│  │  │  • register()   │  │  • onAuthenticationSuccess()  │  │  │
│  │  │  • login()      │  │  • processOAuth2Login()       │  │  │
│  │  │  • logout()     │  │  • generateTokens()           │  │  │
│  │  └─────────────────┘  └──────────────────────────────┘  │  │
│  │                                                           │  │
│  │  ┌─────────────────┐  ┌──────────────────────────────┐  │  │
│  │  │  UserService    │  │  JwtProvider                  │  │  │
│  │  │  • loadUser()   │  │  • generateAccessToken()      │  │  │
│  │  │  • updateUser() │  │  • createRefreshToken()       │  │  │
│  │  └─────────────────┘  └──────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Repository Layer                        │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  UserRepository                                      │ │  │
│  │  │  • findByEmail()                                     │ │  │
│  │  │  • existsByEmail()                                   │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  UserOAuthProviderRepository                         │ │  │
│  │  │  • findByProviderAndProviderId()                     │ │  │
│  │  │  • existsByUserAndProvider()                         │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      MySQL DATABASE                              │
│  ┌──────────────┐  ┌─────────────────────┐  ┌─────────────────┐│
│  │  app_user    │  │ user_oauth_provider │  │ refresh_token   ││
│  │              │  │                     │  │                 ││
│  │ • email      │  │ • user_id (FK)      │  │ • user_id (FK)  ││
│  │ • password   │  │ • provider (GOOGLE) │  │ • token         ││
│  │ • first_name │  │ • provider_id       │  │ • expiry_date   ││
│  │ • roles      │  │ • profile_pic       │  │                 ││
│  └──────────────┘  └─────────────────────┘  └─────────────────┘│
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL OAUTH2 PROVIDERS                       │
│  ┌─────────────────┐              ┌─────────────────┐           │
│  │ Google OAuth2   │              │ GitHub OAuth2   │           │
│  │ • Authorization │              │ • Authorization │           │
│  │ • Token API     │              │ • Token API     │           │
│  │ • UserInfo API  │              │ • UserInfo API  │           │
│  └─────────────────┘              └─────────────────┘           │
└──────────────────────────────────────────────────────────────────┘

```

```
┌─────────────────────────────────────────────────────────────────┐
│                     EMAIL UNIQUENESS STRATEGY                    │
└─────────────────────────────────────────────────────────────────┘

RULE: One email = One account (can have multiple auth methods)

┌─────────────────────────────────────────────────────────────────┐
│  Scenario 1: New User - Google OAuth                            │
├─────────────────────────────────────────────────────────────────┤
│  Email: john@gmail.com (NEW)                                    │
│  Action: CREATE new user with GOOGLE provider                   │
│  Result:                                                         │
│    • User created in app_user                                   │
│    • GOOGLE provider added to user_oauth_provider               │
│    • password_hash = NULL                                       │
│    • is_email_verified = TRUE                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Scenario 2: Existing LOCAL User - Google OAuth                 │
├─────────────────────────────────────────────────────────────────┤
│  Email: john@gmail.com (EXISTS with LOCAL)                      │
│  Action: LINK Google provider to existing account               │
│  Result:                                                         │
│    • GOOGLE provider added to user_oauth_provider               │
│    • User can now login with BOTH password AND Google           │
│    • Password remains valid                                     │
│    • Profile picture updated from Google                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Scenario 3: Existing GOOGLE User - LOCAL Login Attempt         │
├─────────────────────────────────────────────────────────────────┤
│  Email: jane@gmail.com (EXISTS with GOOGLE only)                │
│  Action: User tries password login                              │
│  Result: ❌ LOGIN FAILS                                          │
│  Error: "This email is registered with GOOGLE.                  │
│          Please use 'Login with Google' button."                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Scenario 4: Multiple OAuth Providers (Advanced)                │
├─────────────────────────────────────────────────────────────────┤
│  Email: alex@gmail.com                                          │
│  Actions:                                                        │
│    1. Register with Google → GOOGLE provider added              │
│    2. Login with GitHub → GITHUB provider added                 │
│  Result:                                                         │
│    • ONE user account                                           │
│    • TWO OAuth providers linked                                 │
│    • User can login with Google OR GitHub OR password           │
└─────────────────────────────────────────────────────────────────┘

```

### 2.3 Component Interaction Flow

```
USER CLICK "Login with Google"
            ↓
┌───────────────────────────────────────────────────────────────┐
│ 1. FRONTEND                                                    │
│    GET /oauth2/authorize/google                                │
└───────────────────┬───────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────────┐
│ 2. SPRING SECURITY (OAuth2LoginFilter)                        │
│    • Reads OAuth2 config from application.properties          │
│    • Builds authorization URL with client_id, scopes          │
│    • Redirects browser to Google                              │
│    URL: https://accounts.google.com/o/oauth2/v2/auth?...      │
└───────────────────┬───────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────────┐
│ 3. GOOGLE AUTHORIZATION SERVER                                 │
│    • User sees Google login page                              │
│    • User enters credentials                                  │
│    • User sees permission consent screen                      │
│    • User clicks "Allow"                                      │
└───────────────────┬───────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────────┐
│ 4. GOOGLE REDIRECTS BACK                                       │
│    GET /login/oauth2/code/google?code=4/0AY0e-g7...           │
└───────────────────┬───────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────────┐
│ 5. SPRING SECURITY (OAuth2LoginFilter)                        │
│    • Intercepts callback                                      │
│    • Extracts authorization code                              │
│    • Exchanges code for access token (background)             │
│    POST https://oauth2.googleapis.com/token                   │
└───────────────────┬───────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────────┐
│ 6. GOOGLE TOKEN ENDPOINT                                       │
│    • Validates code                                           │
│    • Returns access token + ID token                          │
│    Response: {"access_token": "ya29...", "id_token": "..."}  │
└───────────────────┬───────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────────┐
│ 7. SPRING SECURITY                                             │
│    • Uses access token to fetch user info                     │
│    GET https://www.googleapis.com/oauth2/v3/userinfo          │
│    • Receives user data: email, name, picture                 │
└───────────────────┬───────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────────┐
│ 8. OAUTH2 SUCCESS HANDLER                                      │
│    onAuthenticationSuccess() method called                     │
│    • Receives OAuth2User object                               │
│    • Calls AuthService.processOAuth2Login()                   │
└───────────────────┬───────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────────┐
│ 9. AUTH SERVICE                                                │
│    processOAuth2Login() method                                 │
│    • Extract email from OAuth2User                            │
│    • Check if user exists in database                         │
│    • If NEW: Create user + link OAuth provider                │
│    • If EXISTS: Link OAuth provider to existing user          │
│    • Generate JWT access token                                │
│    • Generate refresh token                                   │
└───────────────────┬───────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────────┐
│ 10. JWT PROVIDER                                               │
│     • generateAccessToken() - Create JWT (15 min)             │
│     • createRefreshToken() - Create refresh token (7 days)    │
│     • Both tokens returned to Success Handler                 │
└───────────────────┬───────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────────┐
│ 11. OAUTH2 SUCCESS HANDLER                                     │
│     • Store tokens in httpOnly cookies                        │
│     • Build redirect URL with success=true                    │
│     • Redirect to: http://localhost:3000/oauth2/redirect      │
└───────────────────┬───────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────────┐
│ 12. FRONTEND (OAuth2 Redirect Page)                           │
│     • Parse success query parameter                           │
│     • If success=true: Redirect to /dashboard                 │
│     • JWT is in httpOnly cookie (automatic)                   │
│     • User is now logged in!                                  │
└───────────────────────────────────────────────────────────────┘

```
