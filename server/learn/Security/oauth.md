# 🔐 Complete OAuth2 Integration Documentation
## Spring Boot + JWT + Google + GitHub OAuth2

> **Version:** 1.0  
> **Last Updated:** November 23, 2025  
> **Author:** ReputeAI Team  
> **Stack:** Spring Boot 3.5.7, Spring Security 6, JWT (RS256/HS256)

---

## 📚 Table of Contents

1. [Introduction to OAuth2](#1-introduction-to-oauth2)
2. [System Architecture](#2-system-architecture)
3. [Prerequisites & Setup](#3-prerequisites--setup)
4. [Database Design](#4-database-design)
5. [Complete Code Implementation](#5-complete-code-implementation)
6. [OAuth2 Provider Setup](#6-oauth2-provider-setup)
7. [Configuration Guide](#7-configuration-guide)
8. [Authentication Flows](#8-authentication-flows)
9. [Security Implementation](#9-security-implementation)
10. [Testing Guide](#10-testing-guide)
11. [Frontend Integration](#11-frontend-integration)
12. [Deployment Guide](#12-deployment-guide)
13. [Troubleshooting](#13-troubleshooting)
14. [Advanced Topics](#14-advanced-topics)
15. [Best Practices](#15-best-practices)
16. [FAQ](#16-faq)

---

## 1. Introduction to OAuth2

### 1.1 What is OAuth2?

OAuth2 (Open Authorization 2.0) is an **authorization framework** that enables applications to obtain limited access to user accounts on third-party services (like Google, GitHub, Facebook) without exposing user passwords.

**Key Concept:** Instead of giving your password to an app, OAuth2 lets you say "Yes, this app can access my info" directly to Google/GitHub.

### 1.2 Why Use OAuth2?

#### ✅ **Benefits:**
1. **No Password Storage** - You never store user's Google/GitHub passwords
2. **Better Security** - Users trust Google/GitHub more than unknown apps
3. **Faster Signup** - Users can register in 2 clicks (no form filling)
4. **Email Verification** - OAuth providers verify emails for you
5. **Profile Data** - Get name, picture, email automatically
6. **Less Maintenance** - No password reset flows for OAuth users

#### ❌ **Challenges:**
1. **Dependency** - If Google/GitHub is down, OAuth login fails
2. **Email Privacy** - GitHub users may hide emails
3. **Multiple Accounts** - Same email across providers needs handling
4. **Token Management** - Need to handle OAuth tokens + JWT tokens
5. **Provider Differences** - Each provider has different data formats

### 1.3 OAuth2 Terminology

| Term | Definition | Example |
|------|------------|---------|
| **Resource Owner** | The user who owns the data | You (the person logging in) |
| **Client** | The application requesting access | Your Spring Boot app |
| **Authorization Server** | Issues access tokens | Google OAuth Server |
| **Resource Server** | Hosts protected data | Google User Info API |
| **Authorization Code** | Temporary code exchanged for token | `4/0AY0e-g7...` |
| **Access Token** | Key to access user data | `ya29.a0AfH6...` |
| **Scope** | Permissions requested | `email`, `profile`, `openid` |
| **Redirect URI** | Where user returns after auth | `http://localhost:8080/login/oauth2/code/google` |

### 1.4 OAuth2 Flow Diagram

```
┌─────────────┐                                  ┌──────────────┐
│   User      │                                  │   Google     │
│  (Browser)  │                                  │   Server     │
└──────┬──────┘                                  └──────┬───────┘
       │                                                │
       │ 1. Click "Login with Google"                  │
       │────────────────────────────────────────►      │
       │                                                │
       │ 2. Redirect to Google login                   │
       │◄────────────────────────────────────────      │
       │                                                │
       │ 3. User enters Google credentials             │
       │────────────────────────────────────────►      │
       │                                                │
       │ 4. Google asks: "Allow app access?"           │
       │◄────────────────────────────────────────      │
       │                                                │
       │ 5. User clicks "Allow"                        │
       │────────────────────────────────────────►      │
       │                                                │
       │ 6. Redirect to app with code                  │
       │◄────────────────────────────────────────      │
       │                                                │
┌──────▼──────┐                                  ┌──────▼───────┐
│  Your App   │                                  │   Google     │
│   Backend   │                                  │   Server     │
└──────┬──────┘                                  └──────┬───────┘
       │                                                │
       │ 7. Exchange code for access token             │
       │────────────────────────────────────────►      │
       │                                                │
       │ 8. Return access token                        │
       │◄────────────────────────────────────────      │
       │                                                │
       │ 9. Use token to get user info                 │
       │────────────────────────────────────────►      │
       │                                                │
       │ 10. Return user data (email, name, etc)       │
       │◄────────────────────────────────────────      │
       │                                                │
       │ 11. Create/Update user in DB                  │
       │                                                │
       │ 12. Generate JWT token                        │
       │                                                │
┌──────▼──────┐                                         
│   User      │                                         
│  (Browser)  │                                         
└─────────────┘                                         
       │                                                
       │ 13. Redirect to frontend with JWT             
       │                                                
       │ 14. User logged in!                           
```

### 1.5 OAuth2 vs Traditional Login

| Aspect | Traditional Login | OAuth2 Login |
|--------|------------------|--------------|
| **User Action** | Fill form + remember password | Click "Login with Google" |
| **Password Storage** | Backend stores hashed password | No password stored |
| **Email Verification** | Send verification email | Auto-verified by provider |
| **Password Reset** | Need reset flow | Not needed |
| **Security Risk** | Password leaks possible | Provider handles security |
| **User Trust** | User must trust your app | User trusts Google/GitHub |
| **Dependency** | No external dependency | Depends on OAuth provider |
| **Offline Support** | Works offline | Needs internet |

---

## 2. System Architecture

### 2.1 High-Level Architecture

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

### 2.2 Authentication Strategy

**Our Approach: Email as Unique Identifier**

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

---

## 3. Prerequisites & Setup

### 3.1 System Requirements

| Component | Version | Purpose |
|-----------|---------|---------|
| Java | 21+ | Backend language |
| Spring Boot | 3.5.7 | Framework |
| Maven | 3.8+ | Build tool |
| MySQL | 8.0+ | Database |
| Node.js | 18+ | Frontend (optional) |
| Git | 2.0+ | Version control |

### 3.2 Dependencies (pom.xml)

Already present in your pom.xml:

```xml
<!-- OAuth2 Client -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>

<!-- Security -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- JWT -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
</dependency>
```

### 3.3 Project Structure

```
reputeai/
├── src/main/java/com/reputeai/server/reputeai/
│   ├── config/
│   │   ├── AppConfig.java
│   │   ├── SecurityConfig.java           ← MODIFIED
│   │   ├── CorsConfig.java
│   │   └── PasswordEncoderConfig.java
│   │
│   ├── security/
│   │   ├── JwtProvider.java
│   │   ├── JwtAuthenticationFilter.java
│   │   ├── AuthEntryPointJwt.java
│   │   │
│   │   └── oauth2/                       ← NEW PACKAGE
│   │       ├── OAuth2UserInfo.java       ← NEW
│   │       ├── GoogleOAuth2UserInfo.java ← NEW
│   │       ├── GitHubOAuth2UserInfo.java ← NEW
│   │       ├── OAuth2UserInfoFactory.java ← NEW
│   │       ├── OAuth2LoginSuccessHandler.java ← NEW
│   │       └── OAuth2LoginFailureHandler.java ← NEW
│   │
│   ├── domain/
│   │   ├── entity/
│   │   │   ├── User.java                 ← MODIFIED
│   │   │   ├── AuthProvider.java         ← NEW
│   │   │   ├── UserOAuthProvider.java    ← NEW
│   │   │   ├── Role.java
│   │   │   ├── Permission.java
│   │   │   └── RefreshToken.java
│   │   │
│   │   └── dto/
│   │       ├── LoginRequestDto.java
│   │       ├── LoginResponseDto.java
│   │       ├── RegisterRequestDto.java
│   │       └── ...
│   │
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── UserOAuthProviderRepository.java ← NEW
│   │   ├── RoleRepository.java
│   │   └── RefreshTokenRepository.java
│   │
│   ├── service/
│   │   ├── AuthService.java              ← MODIFIED
│   │   ├── UserService.java
│   │   └── impl/
│   │       ├── AuthServiceImpl.java      ← MODIFIED
│   │       └── UserServiceImpl.java
│   │
│   ├── controller/
│   │   ├── AuthController.java
│   │   └── UserController.java
│   │
│   └── exception/
│       ├── BadRequestException.java
│       ├── UnauthorizedException.java
│       └── ConflictException.java
│
├── src/main/resources/
│   ├── application.properties            ← MODIFIED
│   ├── application-dev.properties
│   ├── application-prod.properties
│   │
│   └── db/migration/
│       ├── V1__initial_schema.sql
│       └── V2__add_oauth_support.sql     ← NEW
│
└── pom.xml
```

---

## 4. Database Design

### 4.1 Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                         app_user                              │
├──────────────────────────────────────────────────────────────┤
│ id (PK) BIGINT                                                │
│ email VARCHAR(255) UNIQUE NOT NULL ← ONE EMAIL = ONE ACCOUNT │
│ password_hash VARCHAR(255) NULL    ← NULL for OAuth users    │
│ first_name VARCHAR(100) NOT NULL                              │
│ last_name VARCHAR(100) NOT NULL                               │
│ is_enabled BOOLEAN DEFAULT TRUE                               │
│ is_email_verified BOOLEAN DEFAULT FALSE ← From OAuth         │
│ profile_picture_url VARCHAR(500)        ← From OAuth         │
│ created_at TIMESTAMP                                          │
│ updated_at TIMESTAMP                                          │
│ created_by BIGINT                                             │
└────────────────────────┬─────────────────────────────────────┘
                         │ 1:N
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                   user_oauth_provider                         │
├──────────────────────────────────────────────────────────────┤
│ id (PK) BIGINT                                                │
│ user_id (FK) BIGINT NOT NULL → app_user.id                   │
│ provider VARCHAR(20) NOT NULL (GOOGLE, GITHUB, LOCAL)        │
│ provider_id VARCHAR(255) NOT NULL ← OAuth provider's user ID │
│ profile_picture_url VARCHAR(500)                              │
│ linked_at TIMESTAMP                                           │
│                                                               │
│ UNIQUE(user_id, provider) ← One provider per user            │
│ UNIQUE(provider, provider_id) ← One OAuth account per user   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      refresh_token                            │
├──────────────────────────────────────────────────────────────┤
│ id (PK) BIGINT                                                │
│ user_id (FK) BIGINT NOT NULL → app_user.id                   │
│ token VARCHAR(500) UNIQUE NOT NULL                            │
│ expiry_date TIMESTAMP NOT NULL                                │
│ created_at TIMESTAMP                                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                           role                                │
├──────────────────────────────────────────────────────────────┤
│ id (PK) BIGINT                                                │
│ name VARCHAR(50) UNIQUE NOT NULL (USER, ADMIN, AUDITOR)      │
└────────────────────────┬─────────────────────────────────────┘
                         │ N:M
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                        user_role                              │
├──────────────────────────────────────────────────────────────┤
│ user_id (FK) BIGINT → app_user.id                            │
│ role_id (FK) BIGINT → role.id                                │
│ PRIMARY KEY (user_id, role_id)                                │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Migration Script

**File:** `src/main/resources/db/migration/V2__add_oauth_support.sql`

```sql
-- V2__add_oauth_support.sql
-- Adds OAuth2 support to existing user system

-- 1. Add OAuth-related columns to app_user table
ALTER TABLE app_user
    ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE NOT NULL AFTER is_enabled,
    ADD COLUMN profile_picture_url VARCHAR(500) AFTER is_email_verified,
    -- Make password nullable for OAuth users
    MODIFY COLUMN password_hash VARCHAR(255) NULL;

-- 2. Create table to track OAuth providers linked to users
CREATE TABLE user_oauth_provider (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(20) NOT NULL,  -- 'GOOGLE', 'GITHUB'
    provider_id VARCHAR(255) NOT NULL,  -- Provider's unique ID for this user
    profile_picture_url VARCHAR(500),
    linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_user_oauth_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    CONSTRAINT uq_provider_provider_id UNIQUE (provider, provider_id),
    CONSTRAINT uq_user_provider UNIQUE (user_id, provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create indexes for faster OAuth provider lookups
CREATE INDEX idx_user_oauth_provider ON user_oauth_provider(provider, provider_id);
CREATE INDEX idx_user_oauth_user_id ON user_oauth_provider(user_id);

-- 4. Create/Update refresh token table (if not exists)
CREATE TABLE IF NOT EXISTS refresh_token (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Add index for refresh token expiry cleanup
CREATE INDEX idx_refresh_token_expiry ON refresh_token(expiry_date);
CREATE INDEX idx_refresh_token_user_id ON refresh_token(user_id);

-- 6. Add comments for documentation
ALTER TABLE app_user 
    MODIFY COLUMN email VARCHAR(255) COMMENT 'Unique email - one email per account',
    MODIFY COLUMN password_hash VARCHAR(255) NULL COMMENT 'NULL for OAuth-only users',
    MODIFY COLUMN is_email_verified BOOLEAN DEFAULT FALSE NOT NULL COMMENT 'Auto-verified by OAuth providers';

ALTER TABLE user_oauth_provider
    MODIFY COLUMN provider VARCHAR(20) NOT NULL COMMENT 'OAuth provider: GOOGLE, GITHUB',
    MODIFY COLUMN provider_id VARCHAR(255) NOT NULL COMMENT 'Provider''s unique user ID (e.g., Google''s sub claim)';
```

### 4.3 Database Sample Data

**After Migration:**

```sql
-- app_user table
+----+------------------+--------------+------------+-----------+------------+-------------------+---------------------+
| id | email            | password_hash| first_name | last_name | is_enabled | is_email_verified | profile_picture_url |
+----+------------------+--------------+------------+-----------+------------+-------------------+---------------------+
| 1  | john@local.com   | $2a$10$N9... | John       | Doe       | TRUE       | FALSE             | NULL                |
| 2  | jane@gmail.com   | NULL         | Jane       | Smith     | TRUE       | TRUE              | https://lh3.google...|
| 3  | alex@example.com | $2a$10$X7... | Alex       | Johnson   | TRUE       | TRUE              | https://lh3.google...|
+----+------------------+--------------+------------+-----------+------------+-------------------+---------------------+

-- user_oauth_provider table
+----+---------+----------+----------------------+-------------------------+---------------------+
| id | user_id | provider | provider_id          | profile_picture_url     | linked_at           |
+----+---------+----------+----------------------+-------------------------+---------------------+
| 1  | 2       | GOOGLE   | 110169484474386276334| https://lh3.google...  | 2024-01-15 10:30:00 |
| 2  | 3       | GOOGLE   | 105382749382749382743| https://lh3.google...  | 2024-01-16 14:20:00 |
| 3  | 3       | GITHUB   | 12345678             | https://avatars.git... | 2024-01-17 09:15:00 |
+----+---------+----------+----------------------+-------------------------+---------------------+

EXPLANATION:
- User 1 (john@local.com): LOCAL authentication only (has password)
- User 2 (jane@gmail.com): GOOGLE OAuth only (no password)
- User 3 (alex@example.com): Has BOTH password AND two OAuth providers linked
```

### 4.4 Database Queries (Common Use Cases)

#### Find user by email
```sql
SELECT * FROM app_user WHERE email = 'john@example.com';
```

#### Check if email exists
```sql
SELECT EXISTS(SELECT 1 FROM app_user WHERE email = 'john@example.com') AS email_exists;
```

#### Find user with all OAuth providers
```sql
SELECT u.*, 
       GROUP_CONCAT(uop.provider) AS oauth_providers
FROM app_user u
LEFT JOIN user_oauth_provider uop ON u.id = uop.user_id
WHERE u.email = 'alex@example.com'
GROUP BY u.id;
```

#### Find OAuth user by provider and provider_id
```sql
SELECT u.* 
FROM app_user u
INNER JOIN user_oauth_provider uop ON u.id = uop.user_id
WHERE uop.provider = 'GOOGLE' 
  AND uop.provider_id = '110169484474386276334';
```

#### Check if user has specific OAuth provider linked
```sql
SELECT EXISTS(
    SELECT 1 
    FROM user_oauth_provider 
    WHERE user_id = 3 
      AND provider = 'GITHUB'
) AS has_github;
```

#### Get all users registered via OAuth
```sql
SELECT u.*, uop.provider, uop.linked_at
FROM app_user u
INNER JOIN user_oauth_provider uop ON u.id = uop.user_id
WHERE u.password_hash IS NULL;
```

#### Find users with expired refresh tokens (cleanup)
```sql
DELETE FROM refresh_token 
WHERE expiry_date < NOW();
```

---

## 5. Complete Code Implementation

### 5.1 Domain Layer - Entities

#### 5.1.1 AuthProvider Enum

**File:** `domain/entity/AuthProvider.java`

```java
package com.reputeai.server.reputeai.domain.entity;

/**
 * Enum representing authentication providers.
 * Used to track how a user registered and which OAuth providers are linked.
 * 
 * Usage:
 * - LOCAL: Traditional username/password authentication
 * - GOOGLE: Google OAuth2 authentication
 * - GITHUB: GitHub OAuth2 authentication
 */
public enum AuthProvider {
    /**
     * Local authentication using email and password.
     * User registered directly in the application.
     */
    LOCAL,
    
    /**
     * Google OAuth2 authentication.
     * User authenticated via Google's OAuth2 service.
     */
    GOOGLE,
    
    /**
     * GitHub OAuth2 authentication.
     * User authenticated via GitHub's OAuth2 service.
     */
    GITHUB;
    
    /**
     * Check if this provider is an OAuth provider.
     * @return true if GOOGLE or GITHUB, false if LOCAL
     */
    public boolean isOAuth() {
        return this != LOCAL;
    }
}
```

#### 5.1.2 UserOAuthProvider Entity

**File:** `domain/entity/UserOAuthProvider.java`

```java
package com.reputeai.server.reputeai.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Entity representing an OAuth provider linked to a user account.
 * 
 * Purpose:
 * - Track which OAuth providers a user has linked
 * - Store provider-specific user identifiers
 * - Support multiple OAuth providers per user
 * 
 * Design:
 * - A user can have multiple OAuth providers (Google + GitHub)
 * - Each provider is uniquely identified by (provider, provider_id)
 * - Each user can have only ONE instance of each provider
 * 
 * Example:
 * User: john@example.com
 * Providers: 
 *   - GOOGLE (provider_id: 110169484474386276334)
 *   - GITHUB (provider_id: 12345678)
 */
@Entity
@Table(name = "user_oauth_provider")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class UserOAuthProvider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Reference to the user who owns this OAuth provider link.
     * LAZY fetch to avoid N+1 queries.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * The OAuth provider type (GOOGLE, GITHUB).
     * Stored as STRING in database.
     */
    @Column(name = "provider", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private AuthProvider provider;

    /**
     * The unique identifier provided by the OAuth provider.
     * 
     * Examples:
     * - Google: "110169484474386276334" (from "sub" claim)
     * - GitHub: "12345678" (from "id" field)
     * 
     * This is the PERMANENT identifier that never changes,
     * even if the user changes their email at the provider.
     */
    @Column(name = "provider_id", nullable = false, length = 255)
    private String providerId;

    /**
     * Profile picture URL from the OAuth provider.
     * Can be updated when user logs in again.
     */
    @Column(name = "profile_picture_url", length = 500)
    private String profilePictureUrl;

    /**
     * Timestamp when this provider was linked to the user account.
     * Auto-populated on creation.
     */
    @CreatedDate
    @Column(name = "linked_at", nullable = false, updatable = false)
    private Instant linkedAt;
    
    /**
     * Convenience method to check if this is a specific provider.
     */
    public boolean isProvider(AuthProvider provider) {
        return this.provider == provider;
    }
}
```

#### 5.1.3 Updated User Entity

**File:** `domain/entity/User.java`

```java
package com.reputeai.server.reputeai.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

/**
 * User entity representing a user account in the system.
 * 
 * Authentication Strategy:
 * - Email is UNIQUE across the system (one email = one account)
 * - Users can authenticate via:
 *   1. LOCAL: Email + Password
 *   2. OAuth: Google, GitHub (or both)
 * 
 * OAuth Integration:
 * - OAuth users have NULL password_hash
 * - OAuth providers are tracked in UserOAuthProvider entity
 * - One user can have multiple OAuth providers linked
 * 
 * Security:
 * - Implements UserDetails for Spring Security integration
 * - Passwords are BCrypt hashed
 * - Email verification tracked separately for OAuth and LOCAL
 */
@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==================== AUTHENTICATION ====================
    
    /**
     * User's email address - UNIQUE globally.
     * Used as the principal/username in Spring Security.
     * 
     * Important: This is unique across LOCAL and OAuth users.
     * One email = one account.
     */
    @Column(name = "email", unique = true, nullable = false, length = 255)
    private String email;

    /**
     * BCrypt hashed password.
     * 
     * NULLABLE: OAuth users don't have passwords.
     * Check hasLocalAuth() to see if user has password authentication.
     */
    @Column(name = "password_hash", nullable = true, length = 255)
    private String passwordHash;

    // ==================== PROFILE ====================
    
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    /**
     * Account enabled status.
     * Disabled accounts cannot login.
     */
    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private boolean isEnabled = true;

    /**
     * Email verification status.
     * 
     * Set to TRUE when:
     * - OAuth provider verifies email (auto-verified)
     * - User clicks verification link in email (LOCAL)
     */
    @Column(name = "is_email_verified", nullable = false)
    @Builder.Default
    private boolean isEmailVerified = false;

    /**
     * Profile picture URL.
     * Usually populated from OAuth providers (Google, GitHub).
     */
    @Column(name = "profile_picture_url", length = 500)
    private String profilePictureUrl;

    // ==================== OAUTH PROVIDERS ====================
    
    /**
     * OAuth providers linked to this user account.
     * 
     * Cascade: ALL - when user is deleted, OAuth links are deleted
     * Orphan Removal: true - when OAuth link is removed from set, it's deleted
     * Fetch: EAGER - load OAuth providers when loading user (needed for auth)
     * 
     * Example:
     * User john@example.com can have:
     * - GOOGLE provider (provider_id: 110169...)
     * - GITHUB provider (provider_id: 12345678)
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private Set<UserOAuthProvider> oauthProviders = new HashSet<>();

    // ==================== AUTHORIZATION (RBAC) ====================
    
    /**
     * Roles assigned to this user.
     * Used for authorization decisions.
     * 
     * Default: USER role assigned on registration
     * Possible roles: USER, ADMIN, AUDITOR
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_role",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    // ==================== AUDITING ====================
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @CreatedBy
    @Column(name = "created_by")
    private Long createdBy;

    // ==================== HELPER METHODS ====================

    /**
     * Check if user has LOCAL password authentication.
     * 
     * @return true if user can login with email+password
     */
    public boolean hasLocalAuth() {
        return passwordHash != null && !passwordHash.isEmpty();
    }

    /**
     * Check if user has specific OAuth provider linked.
     * 
     * @param provider The OAuth provider to check
     * @return true if provider is linked to this user
     */
    public boolean hasOAuthProvider(AuthProvider provider) {
        return oauthProviders.stream()
                .anyMatch(oauth -> oauth.getProvider() == provider);
    }

    /**
     * Get OAuth provider info for specific provider.
     * 
     * @param provider The OAuth provider to find
     * @return UserOAuthProvider if found, null otherwise
     */
    public UserOAuthProvider getOAuthProvider(AuthProvider provider) {
        return oauthProviders.stream()
                .filter(oauth -> oauth.getProvider() == provider)
                .findFirst()
                .orElse(null);
    }

    /**
     * Add OAuth provider to user.
     * Maintains bidirectional relationship.
     * 
     * @param oauthProvider The OAuth provider to add
     */
    public void addOAuthProvider(UserOAuthProvider oauthProvider) {
        oauthProviders.add(oauthProvider);
        oauthProvider.setUser(this);
    }

    /**
     * Remove OAuth provider from user.
     * Maintains bidirectional relationship.
     * 
     * @param oauthProvider The OAuth provider to remove
     */
    public void removeOAuthProvider(UserOAuthProvider oauthProvider) {
        oauthProviders.remove(oauthProvider);
        oauthProvider.setUser(null);
    }

    /**
     * Get comma-separated list of OAuth providers.
     * Useful for logging and display.
     * 
     * @return e.g., "GOOGLE, GITHUB" or "NONE"
     */
    public String getOAuthProvidersString() {
        if (oauthProviders.isEmpty()) {
            return "NONE";
        }
        return oauthProviders.stream()
                .map(oauth -> oauth.getProvider().name())
                .reduce((a, b) -> a + ", " + b)
                .orElse("NONE");
    }

    // ==================== SPRING SECURITY USERDETAILS ====================

    @Override
    public boolean isEmailVerified() {
        // GitHub doesn't provide email_verified claim
        // If email exists in response, assume it's verified
        // (GitHub verifies emails before allowing OAuth)
        return attributes.get("email") != null;
    }
}
```

#### 5.3.4 OAuth2UserInfoFactory

**File:** `security/oauth2/OAuth2UserInfoFactory.java`

```java
package com.reputeai.server.reputeai.security.oauth2;

import com.reputeai.server.reputeai.domain.entity.AuthProvider;
import com.reputeai.server.reputeai.exception.BadRequestException;

import java.util.Map;

/**
 * Factory for creating provider-specific OAuth2UserInfo implementations.
 * 
 * Pattern: Factory Pattern
 * - Encapsulates creation logic
 * - Provides single point for adding new OAuth providers
 * 
 * Usage:
 * OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(
 *     "google",
 *     oauth2User.getAttributes()
 * );
 */
public class OAuth2UserInfoFactory {

    /**
     * Create OAuth2UserInfo implementation based on registration ID.
     * 
     * @param registrationId The OAuth provider registration ID (google, github)
     * @param attributes The attributes map from OAuth2User
     * @return Provider-specific OAuth2UserInfo implementation
     * @throws BadRequestException if provider is not supported
     */
    public static OAuth2UserInfo getOAuth2UserInfo(String registrationId, 
                                                   Map<String, Object> attributes) {
        if (registrationId == null || registrationId.isEmpty()) {
            throw new BadRequestException("OAuth provider cannot be null or empty");
        }
        
        // Convert registration ID to AuthProvider enum
        AuthProvider provider;
        try {
            provider = AuthProvider.valueOf(registrationId.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Login with " + registrationId + " is not supported");
        }

        // Return appropriate implementation
        return switch (provider) {
            case GOOGLE -> new GoogleOAuth2UserInfo(attributes);
            case GITHUB -> new GitHubOAuth2UserInfo(attributes);
            case LOCAL -> throw new BadRequestException("LOCAL is not an OAuth provider");
        };
    }
}
```

#### 5.3.5 OAuth2LoginSuccessHandler

**File:** `security/oauth2/OAuth2LoginSuccessHandler.java`

```java
package com.reputeai.server.reputeai.security.oauth2;

import com.reputeai.server.reputeai.domain.dto.LoginResponseDto;
import com.reputeai.server.reputeai.service.AuthService;
import com.reputeai.server.reputeai.util.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * Handles successful OAuth2 authentication.
 * 
 * Flow:
 * 1. Receive OAuth2User from Spring Security
 * 2. Extract user info (email, name, picture)
 * 3. Create/update user in database
 * 4. Generate JWT tokens
 * 5. Set tokens in httpOnly cookies
 * 6. Redirect to frontend with success status
 * 
 * This handler is called AFTER:
 * - User authenticates at OAuth provider (Google/GitHub)
 * - Spring Security exchanges authorization code for access token
 * - Spring Security fetches user info from provider
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;
    private final CookieUtil cookieUtil;

    /**
     * Frontend redirect URI after OAuth2 login.
     * Frontend should have a route at this path to handle the redirect.
     */
    @Value("${app.oauth2.redirect-uri:http://localhost:3000/oauth2/redirect}")
    private String oauth2RedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        // Cast to OAuth2 authentication
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oauth2User = oauthToken.getPrincipal();
        String registrationId = oauthToken.getAuthorizedClientRegistrationId();

        log.info("OAuth2 authentication successful for provider: {}", registrationId);
        log.debug("OAuth2 attributes received: {}", oauth2User.getAttributes());

        try {
            // Process OAuth2 user (create/update user, generate JWT)
            LoginResponseDto loginResponse = authService.processOAuth2Login(oauth2User, registrationId);

            // Set JWT tokens in httpOnly cookies
            // These cookies are automatically sent with future requests
            cookieUtil.setAuthCookies(response,
                    loginResponse.getAccessToken(),
                    loginResponse.getRefreshToken());

            // Build redirect URL with success parameter
            String redirectUrl = UriComponentsBuilder.fromUriString(oauth2RedirectUri)
                    .queryParam("success", "true")
                    .build()
                    .toUriString();

            log.info("OAuth2 login successful for user: {}, redirecting to: {}", 
                    loginResponse.getEmail(), redirectUrl);

            // Redirect browser to frontend
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);

        } catch (Exception e) {
            log.error("OAuth2 login processing failed for provider {}: {}", 
                    registrationId, e.getMessage(), e);

            // Build redirect URL with error parameter
            String errorMessage = e.getMessage();
            String redirectUrl = UriComponentsBuilder.fromUriString(oauth2RedirectUri)
                    .queryParam("success", "false")
                    .queryParam("error", errorMessage)
                    .build()
                    .toUriString();

            // Redirect to frontend with error
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        }
    }
}
```

#### 5.3.6 OAuth2LoginFailureHandler

**File:** `security/oauth2/OAuth2LoginFailureHandler.java`

```java
package com.reputeai.server.reputeai.security.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * Handles OAuth2 authentication failures.
 * 
 * Called when:
 * - User denies permission at OAuth provider
 * - OAuth provider returns error
 * - Invalid OAuth configuration
 * - Network errors during OAuth flow
 * 
 * Flow:
 * 1. Log the error
 * 2. Extract error information
 * 3. Redirect to frontend with error details
 */
@Component
@Slf4j
public class OAuth2LoginFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Value("${app.oauth2.redirect-uri:http://localhost:3000/oauth2/redirect}")
    private String oauth2RedirectUri;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {

        // Log the failure with details
        log.error("OAuth2 authentication failed: {}", exception.getMessage());
        log.debug("OAuth2 failure details - Request URI: {}, Exception: {}", 
                request.getRequestURI(), exception.getClass().getSimpleName());

        // Extract error details from request (sent by OAuth provider)
        String errorCode = request.getParameter("error");
        String errorDescription = request.getParameter("error_description");

        // Build user-friendly error message
        String errorMessage;
        if (errorCode != null) {
            errorMessage = switch (errorCode) {
                case "access_denied" -> "You denied permission. Please try again and allow access.";
                case "invalid_scope" -> "Invalid permissions requested. Please contact support.";
                case "server_error" -> "OAuth provider error. Please try again later.";
                default -> "OAuth authentication failed: " + errorCode;
            };
        } else {
            errorMessage = "OAuth authentication failed. Please try again.";
        }

        log.warn("OAuth2 error - Code: {}, Description: {}", errorCode, errorDescription);

        // Build redirect URL with error
        String redirectUrl = UriComponentsBuilder.fromUriString(oauth2RedirectUri)
                .queryParam("success", "false")
                .queryParam("error", errorMessage)
                .build()
                .toUriString();

        // Redirect to frontend
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
```

#### 5.3.7 Updated SecurityConfig

**File:** `security/SecurityConfig.java`

```java
package com.reputeai.server.reputeai.security;

import com.reputeai.server.reputeai.security.oauth2.OAuth2LoginFailureHandler;
import com.reputeai.server.reputeai.security.oauth2.OAuth2LoginSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;

/**
 * Main security configuration for the application.
 * 
 * Configures:
 * 1. JWT authentication filter
 * 2. OAuth2 login flow
 * 3. Public/protected endpoints
 * 4. Session management (stateless)
 * 5. CORS
 * 6. Exception handling
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // Enables @PreAuthorize for fine-grained authorization
@RequiredArgsConstructor
public class SecurityConfig {

    private final ObjectProvider<JwtAuthenticationFilter> jwtAuthenticationFilterProvider;
    private final AuthEntryPointJwt unauthorizedHandler;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    
    // OAuth2 handlers
    private final OAuth2LoginSuccessHandler oauth2LoginSuccessHandler;
    private final OAuth2LoginFailureHandler oauth2LoginFailureHandler;

    /**
     * Public endpoints that don't require authentication.
     */
    private static final String[] PUBLIC_ENDPOINTS = {
            // Authentication endpoints
            "/api/v1/auth/**",
            
            // OAuth2 endpoints
            "/oauth2/**",
            "/login/oauth2/code/**",  // OAuth2 callback URL
            
            // API documentation
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/api/v1/swagger-ui/**",
            "/api/v1/swagger-ui.html",
            "/api/v1/docs/**",
            
            // Monitoring & health
            "/actuator/health",
            
            // Static resources
            "/favicon.ico",
            "/error"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Enable CORS with CorsConfigurationSource bean
                .cors(cors -> {})
                
                // Disable CSRF (safe for stateless JWT authentication)
                .csrf(AbstractHttpConfigurer::disable)
                
                // Configure exception handling
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(unauthorizedHandler)
                )
                
                // Stateless session management (no server-side sessions)
                .sessionManagement(sess -> sess
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                
                // Configure endpoint authorization
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .anyRequest().authenticated()
                )
                
                // ============ OAuth2 Login Configuration ============
                .oauth2Login(oauth2 -> oauth2
                        // Authorization endpoint (where OAuth flow starts)
                        .authorizationEndpoint(authorization -> authorization
                                .baseUri("/oauth2/authorize")
                        )
                        // Redirection endpoint (where OAuth provider redirects back)
                        .redirectionEndpoint(redirection -> redirection
                                .baseUri("/login/oauth2/code/*")
                        )
                        // Success handler - called when OAuth login succeeds
                        .successHandler(oauth2LoginSuccessHandler)
                        // Failure handler - called when OAuth login fails
                        .failureHandler(oauth2LoginFailureHandler)
                );

        // Add JWT authentication filter before standard authentication filter
        JwtAuthenticationFilter jwtFilter = jwtAuthenticationFilterProvider.getIfAvailable();
        if (jwtFilter != null) {
            http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        }

        return http.build();
    }

    /**
     * Ignore security for static resources (no filter chain applied).
     */
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring().requestMatchers(
                "/v3/api-docs/**",
                "/swagger-ui/**",
                "/swagger-ui.html",
                "/webjars/**",
                "/favicon.ico"
        );
    }

    /**
     * Authentication manager for LOCAL (username/password) authentication.
     */
    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }

    /**
     * Expose UserService as UserDetailsService for Spring Security.
     */
    @Bean
    public UserDetailsService userDetailsService(com.reputeai.server.reputeai.service.UserService userService) {
        return userService;
    }
}
```

### 5.4 Service Layer

#### 5.4.1 Updated AuthService Interface

**File:** `service/AuthService.java`

```java
package com.reputeai.server.reputeai.service;

import com.reputeai.server.reputeai.domain.dto.*;
import org.springframework.security.oauth2.core.user.OAuth2User;

/**
 * Service interface for authentication operations.
 * 
 * Handles:
 * - LOCAL authentication (email + password)
 * - OAuth2 authentication (Google, GitHub)
 * - Token management (JWT + refresh tokens)
 * - Email verification
 * - Password reset
 */
public interface AuthService {

    // ========== LOCAL AUTHENTICATION ==========

    /**
     * Register a new user with LOCAL authentication.
     * Creates user with password and assigns default USER role.
     * 
     * @param registerRequestDto Registration details (email, password, name)
     * @return Registration response with user ID
     * @throws ConflictException if email already exists
     */
    RegisterResponseDto register(RegisterRequestDto registerRequestDto);

    /**
     * Authenticate user with LOCAL credentials (email + password).
     * Generates JWT access token and refresh token.
     * 
     * @param loginRequestDto Login credentials
     * @return Login response with JWT tokens
     * @throws UnauthorizedException if credentials are invalid
     */
    LoginResponseDto login(LoginRequestDto loginRequestDto);

    // ========== OAUTH2 AUTHENTICATION ==========

    /**
     * Process OAuth2 login from Google or GitHub.
     * 
     * Flow:
     * 1. Extract user info from OAuth2User
     * 2. Check if email exists in database
     * 3. If NEW: Create user with OAuth provider
     * 4. If EXISTS: Link OAuth provider to existing user
     * 5. Generate JWT tokens
     * 
     * Email Uniqueness Strategy:
     * - One email = one account
     * - User can have multiple OAuth providers linked
     * - User can have both password AND OAuth
     * 
     * @param oauth2User OAuth2 user data from provider
     * @param registrationId Provider name (google, github)
     * @return Login response with JWT tokens
     * @throws BadRequestException if provider is invalid or email is missing
     */
    LoginResponseDto processOAuth2Login(OAuth2User oauth2User, String registrationId);

    // ========== TOKEN MANAGEMENT ==========

    /**
     * Refresh access token using refresh token.
     * 
     * @param refreshToken The refresh token string
     * @return New access token
     * @throws RuntimeException if refresh token is invalid or expired
     */
    RefreshTokenResponseDto refreshToken(String refreshToken);

    /**
     * Logout user by invalidating refresh token.
     * 
     * @param refreshToken The refresh token to invalidate
     */
    void logout(String refreshToken);

    // ========== EMAIL VERIFICATION ==========

    /**
     * Request OTP for email verification (public endpoint).
     * 
     * @param email Email to verify
     * @return Success response
     */
    SimpleSuccessResponseDto requestEmailVerification(String email);

    /**
     * Verify email using OTP (public endpoint).
     * 
     * @param request OTP verification request
     * @return Success response
     */
    SimpleSuccessResponseDto verifyEmailOtp(VerifyEmailRequestDto request);

    // ========== PASSWORD RESET ==========

    /**
     * Initiate forgot password flow (public endpoint).
     * 
     * @param request Forgot password request with email
     * @return Success response
     */
    SimpleSuccessResponseDto forgotPassword(ForgotPasswordRequestDto request);

    /**
     * Reset password using reset token (public endpoint).
     * 
     * @param request Reset password request with token and new password
     * @return Success response
     */
    SimpleSuccessResponseDto resetPassword(ResetPasswordRequestDto request);
}
```

#### 5.4.2 Updated AuthServiceImpl (CRITICAL)

**File:** `service/impl/AuthServiceImpl.java`

```java
package com.reputeai.server.reputeai.service.impl;

import com.reputeai.server.reputeai.constants.MessageConstants;
import com.reputeai.server.reputeai.domain.dto.*;
import com.reputeai.server.reputeai.domain.entity.*;
import com.reputeai.server.reputeai.exception.BadRequestException;
import com.reputeai.server.reputeai.exception.ConflictException;
import com.reputeai.server.reputeai.exception.UnauthorizedException;
import com.reputeai.server.reputeai.repository.RoleRepository;
import com.reputeai.server.reputeai.repository.UserOAuthProviderRepository;
import com.reputeai.server.reputeai.repository.UserRepository;
import com.reputeai.server.reputeai.security.JwtProvider;
import com.reputeai.server.reputeai.security.oauth2.OAuth2UserInfo;
import com.reputeai.server.reputeai.security.oauth2.OAuth2UserInfoFactory;
import com.reputeai.server.reputeai.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

/**
 * Implementation of AuthService.
 * 
 * Key Features:
 * - Email uniqueness enforcement
 * - OAuth provider linking
 * - JWT token generation
 * - Graceful error handling
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserOAuthProviderRepository userOAuthProviderRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final AuthenticationManager authenticationManager;

    // ========== LOCAL REGISTRATION ==========

    @Override
    @Transactional
    public RegisterResponseDto register(RegisterRequestDto registerRequestDto) {
        String email = registerRequestDto.getEmail();
        log.info("Registration attempt for email: {}", email);

        // Check if email already exists
        if (userRepository.existsByEmail(email)) {
            log.warn("Registration failed: Email already exists: {}", email);
            throw new ConflictException("Email already registered. Please login or use a different email.");
        }

        // Create new user
        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(registerRequestDto.getPassword()))
                .firstName(registerRequestDto.getFirstName())
                .lastName(registerRequestDto.getLastName())
                .isEnabled(true)
                .isEmailVerified(false)  // Will be verified later
                .build();

        // Assign default USER role
        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RuntimeException("Default USER role not found in database"));

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);

        // Save user
        User savedUser = userRepository.save(user);
        log.info("User registered successfully - ID: {}, Email: {}", savedUser.getId(), savedUser.getEmail());

        return RegisterResponseDto.builder()
                .success(true)
                .message("Registration successful. Please verify your email.")
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .build();
    }

    // ========== LOCAL LOGIN ==========

    @Override
    @Transactional
    public LoginResponseDto login(LoginRequestDto loginRequestDto) {
        String email = loginRequestDto.getEmail();
        log.info("Login attempt for email: {}", email);

        // Find user by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Login failed: User not found: {}", email);
                    return new UnauthorizedException("Invalid email or password");
                });

        // ========== CRITICAL: Check if user has LOCAL authentication ==========
        if (!user.hasLocalAuth()) {
            // User registered via OAuth - get first OAuth provider
            AuthProvider oauthProvider = user.getOauthProviders().stream()
                    .map(UserOAuthProvider::getProvider)
                    .findFirst()
                    .orElse(null);

            String message = oauthProvider != null
                    ? String.format("This email is registered with %s. Please use '%s Login' button.",
                    oauthProvider.name(), oauthProvider.name())
                    : "This email is registered with OAuth. Please use social login.";

            log.warn("Login failed: User {} has no local password (OAuth user with providers: {})",
                    email, user.getOAuthProvidersString());
            throw new UnauthorizedException(message);
        }

        // Authenticate with password
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, loginRequestDto.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Generate tokens
            return generateLoginResponse(user);

        } catch (Exception e) {
            log.warn("Login failed: Invalid password for user: {}", email);
            throw new UnauthorizedException("Invalid email or password");
        }
    }

    // ========== OAUTH2 LOGIN ==========

    @Override
    @Transactional
    public LoginResponseDto processOAuth2Login(OAuth2User oauth2User, String registrationId) {
        log.info("Processing OAuth2 login for provider: {}", registrationId);

        // Step 1: Extract user info from OAuth2 provider
        OAuth2UserInfo oauth2UserInfo;
        try {
            oauth2UserInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(
                    registrationId,
                    oauth2User.getAttributes()
            );
        } catch (Exception e) {
            log.error("Failed to extract OAuth2 user info from {}: {}", registrationId, e.getMessage());
            throw new BadRequestException("Failed to process OAuth2 login: " + e.getMessage());
        }

        // Step 2: Validate email
        String email = oauth2UserInfo.getEmail();
        if (email == null || email.isEmpty()) {
            log.error("OAuth2 login failed: Email not provided by {}", registrationId);
            throw new BadRequestException(
                    String.format("%s did not provide email. Please ensure email permission is granted and your email is public.",
                            registrationId.toUpperCase())
            );
        }

        String providerId = oauth2UserInfo.getProviderId();
        if (providerId == null || providerId.isEmpty()) {
            log.error("OAuth2 login failed: Provider ID not provided by {}", registrationId);
            throw new BadRequestException(registrationId.toUpperCase() + " did not provide user ID");
        }

        AuthProvider provider = AuthProvider.valueOf(registrationId.toUpperCase());

        log.debug("OAuth2 user info extracted - Email: {}, ProviderId: {}, Provider: {}",
                email, providerId, provider);

        // Step 3: Check if user exists by email
        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null) {
            // User exists - handle linking
            return handleExistingUserOAuth2Login(user, oauth2UserInfo, provider, providerId);
        } else {
            // New user - create account
            return handleNewUserOAuth2Login(oauth2UserInfo, provider, providerId);
        }
    }

    /**
     * Handle OAuth2 login for EXISTING user.
     * Links OAuth provider if not already linked.
     */
    private LoginResponseDto handleExistingUserOAuth2Login(User user,
                                                            OAuth2UserInfo oauth2UserInfo,
                                                            AuthProvider provider,
                                                            String providerId) {
        log.info("Existing user found for email: {} (User ID: {})", user.getEmail(), user.getId());

        // Check if this OAuth provider is already linked
        UserOAuthProvider existingOAuthProvider = user.getOAuthProvider(provider);

        if (existingOAuthProvider == null) {
            // Link this OAuth provider to existing account
            log.info("Linking {} provider to existing user: {} (User ID: {})",
                    provider, user.getEmail(), user.getId());

            UserOAuthProvider newOAuthProvider = UserOAuthProvider.builder()
                    .user(user)
                    .provider(provider)
                    .providerId(providerId)
                    .profilePictureUrl(oauth2UserInfo.getProfilePictureUrl())
                    .build();

            user.addOAuthProvider(newOAuthProvider);

            // Update email verification if OAuth provider verified it
            if (oauth2UserInfo.isEmailVerified() && !user.isEmailVerified()) {
                user.setEmailVerified(true);
                log.info("Email verified via {} OAuth for user: {}", provider, user.getEmail());
            }

            // Update profile picture if not set
            if (user.getProfilePictureUrl() == null && oauth2UserInfo.getProfilePictureUrl() != null) {
                user.setProfilePictureUrl(oauth2UserInfo.getProfilePictureUrl());
                log.debug("Profile picture updated from {} OAuth", provider);
            }

            userRepository.save(user);
            log.info("Successfully linked {} provider to user: {}", provider, user.getEmail());

        } else {
            // OAuth provider already linked - just update profile picture if changed
            log.info("OAuth provider {} already linked to user: {} (User ID: {})",
                    provider, user.getEmail(), user.getId());

            String newPictureUrl = oauth2UserInfo.getProfilePictureUrl();
            if (newPictureUrl != null && !newPictureUrl.equals(existingOAuthProvider.getProfilePictureUrl())) {
                existingOAuthProvider.setProfilePictureUrl(newPictureUrl);
                user.setProfilePictureUrl(newPictureUrl);
                userRepository.save(user);
                log.debug("Updated profile picture for user: {}", user.getEmail());
            }
        }

        // Generate tokens
        return generateLoginResponse(user);
    }

    /**
     * Handle OAuth2 login for NEW user.
     * Creates new account with OAuth provider.
     */
    @Transactional
    private LoginResponseDto handleNewUserOAuth2Login(OAuth2UserInfo oauth2UserInfo,
                                                       AuthProvider provider,
                                                       String providerId) {
        String email = oauth2UserInfo.getEmail();
        log.info("Creating new user from {} OAuth - Email: {}", provider, email);

        // Create new user
        User user = User.builder()
                .email(email)
                .firstName(oauth2UserInfo.getFirstName())
                .lastName(oauth2UserInfo.getLastName())
                .passwordHash(null)  // No password for OAuth users
                .isEnabled(true)
                .isEmailVerified(oauth2UserInfo.isEmailVerified())
                .profilePictureUrl(oauth2UserInfo.getProfilePictureUrl())
                .build();

        // Assign default USER role
        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RuntimeException("Default USER role not found in database"));

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);

        // Create OAuth provider link
        UserOAuthProvider oauthProvider = UserOAuthProvider.builder()
                .user(user)
                .provider(provider)
                .providerId(providerId)
                .profilePictureUrl(oauth2UserInfo.get
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.roles;
    }

    @Override
    public String getPassword() {
        return this.passwordHash;
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return this.isEnabled;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return this.isEnabled;
    }
    
    // ==================== EQUALS & HASHCODE ====================
    
    /**
     * Equals based on ID (primary key).
     * Required for proper Set/Map operations.
     */
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User)) return false;
        User user = (User) o;
        return id != null && id.equals(user.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

### 5.2 Repository Layer

#### 5.2.1 UserOAuthProviderRepository

**File:** `repository/UserOAuthProviderRepository.java`

```java
package com.reputeai.server.reputeai.repository;

import com.reputeai.server.reputeai.domain.entity.AuthProvider;
import com.reputeai.server.reputeai.domain.entity.User;
import com.reputeai.server.reputeai.domain.entity.UserOAuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for managing OAuth provider links.
 * 
 * Use Cases:
 * - Find OAuth user by provider and provider_id (during OAuth login)
 * - Check if user has specific OAuth provider linked
 * - Link new OAuth provider to existing user
 * - Remove OAuth provider from user (unlink)
 */
@Repository
public interface UserOAuthProviderRepository extends JpaRepository<UserOAuthProvider, Long> {

    /**
     * Find OAuth provider link by provider type and provider's user ID.
     * 
     * Use Case: OAuth login - check if this OAuth account exists in our system
     * 
     * Example:
     * - provider: GOOGLE
     * - providerId: "110169484474386276334" (Google's sub claim)
     * 
     * @param provider The OAuth provider (GOOGLE, GITHUB)
     * @param providerId The provider's unique user ID
     * @return OAuth provider link if found
     */
    Optional<UserOAuthProvider> findByProviderAndProviderId(AuthProvider provider, String providerId);

    /**
     * Find OAuth provider link for a specific user and provider.
     * 
     * Use Case: Check if user already has this OAuth provider linked
     * 
     * Example: Check if john@example.com has GITHUB linked
     * 
     * @param user The user entity
     * @param provider The OAuth provider to check
     * @return OAuth provider link if found
     */
    Optional<UserOAuthProvider> findByUserAndProvider(User user, AuthProvider provider);

    /**
     * Check if user has specific OAuth provider linked.
     * 
     * More efficient than findByUserAndProvider when only checking existence.
     * 
     * @param user The user entity
     * @param provider The OAuth provider to check
     * @return true if provider is linked
     */
    boolean existsByUserAndProvider(User user, AuthProvider provider);

    /**
     * Delete all OAuth providers for a user.
     * 
     * Use Case: User account deletion or unlinking all OAuth providers
     * 
     * @param user The user whose OAuth links to delete
     */
    void deleteByUser(User user);
}
```

#### 5.2.2 Updated UserRepository

**File:** `repository/UserRepository.java`

```java
package com.reputeai.server.reputeai.repository;

import com.reputeai.server.reputeai.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for User entity operations.
 * 
 * Key Points:
 * - Email is UNIQUE globally (enforced at database level)
 * - Use findByEmail for both LOCAL and OAuth users
 * - All OAuth provider info is loaded via User.oauthProviders
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by email address.
     * 
     * Works for BOTH:
     * - LOCAL users (with password)
     * - OAuth users (without password)
     * 
     * @param email The email to search for
     * @return User if found
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if email exists in the system.
     * 
     * More efficient than findByEmail when only checking existence.
     * 
     * @param email The email to check
     * @return true if email exists
     */
    boolean existsByEmail(String email);

    /**
     * Find user by email with all roles and permissions eagerly loaded.
     * 
     * Optimization for authentication - loads everything needed in one query.
     * Prevents N+1 query problem.
     * 
     * @param email The email to search for
     * @return User with roles and permissions loaded
     */
    @Query("SELECT u FROM User u " +
           "LEFT JOIN FETCH u.roles r " +
           "LEFT JOIN FETCH r.permissions " +
           "LEFT JOIN FETCH u.oauthProviders " +
           "WHERE u.email = :email")
    Optional<User> findByEmailWithRolesAndPermissions(@Param("email") String email);
}
```

### 5.3 Security Layer - OAuth2 Components

#### 5.3.1 OAuth2UserInfo Interface

**File:** `security/oauth2/OAuth2UserInfo.java`

```java
package com.reputeai.server.reputeai.security.oauth2;

/**
 * Abstract interface for extracting user information from OAuth2 providers.
 * 
 * Purpose:
 * - Provide unified interface for different OAuth providers
 * - Each provider returns data in different formats
 * - This interface normalizes the data extraction
 * 
 * Implementations:
 * - GoogleOAuth2UserInfo: Extracts data from Google OAuth response
 * - GitHubOAuth2UserInfo: Extracts data from GitHub OAuth response
 * 
 * Pattern: Strategy Pattern
 * - Factory creates the appropriate implementation based on provider
 */
public interface OAuth2UserInfo {
    
    /**
     * Get the provider's unique user ID.
     * This ID NEVER changes, even if user changes email.
     * 
     * Examples:
     * - Google: "110169484474386276334" (from "sub" claim)
     * - GitHub: "12345678" (from "id" field)
     * 
     * @return Provider's unique user identifier
     */
    String getProviderId();
    
    /**
     * Get user's email address.
     * May be null for GitHub if user hasn't made email public.
     * 
     * @return User's email or null
     */
    String getEmail();
    
    /**
     * Get user's first name.
     * Extracted from different fields depending on provider.
     * 
     * @return First name
     */
    String getFirstName();
    
    /**
     * Get user's last name.
     * May be empty if provider doesn't provide it.
     * 
     * @return Last name or empty string
     */
    String getLastName();
    
    /**
     * Get user's profile picture URL.
     * 
     * @return Profile picture URL or null
     */
    String getProfilePictureUrl();
    
    /**
     * Check if email is verified by the provider.
     * 
     * @return true if email is verified
     */
    boolean isEmailVerified();
}
```

#### 5.3.2 GoogleOAuth2UserInfo Implementation

**File:** `security/oauth2/GoogleOAuth2UserInfo.java`

```java
package com.reputeai.server.reputeai.security.oauth2;

import java.util.Map;

/**
 * Extracts user information from Google OAuth2 response.
 * 
 * Google OAuth2 User Info Endpoint Response:
 * {
 *   "sub": "110169484474386276334",           ← Unique Google user ID
 *   "email": "john@gmail.com",
 *   "email_verified": true,
 *   "given_name": "John",
 *   "family_name": "Doe",
 *   "name": "John Doe",
 *   "picture": "https://lh3.googleusercontent.com/..."
 * }
 * 
 * Documentation:
 * https://developers.google.com/identity/protocols/oauth2/openid-connect#an-id-tokens-payload
 */
public class GoogleOAuth2UserInfo implements OAuth2UserInfo {

    private final Map<String, Object> attributes;

    public GoogleOAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public String getProviderId() {
        // Google's unique user ID - "sub" (subject) claim
        // This NEVER changes, even if user changes email
        return (String) attributes.get("sub");
    }

    @Override
    public String getEmail() {
        return (String) attributes.get("email");
    }

    @Override
    public String getFirstName() {
        // Google provides "given_name" for first name
        return (String) attributes.get("given_name");
    }

    @Override
    public String getLastName() {
        // Google provides "family_name" for last name
        return (String) attributes.get("family_name");
    }

    @Override
    public String getProfilePictureUrl() {
        return (String) attributes.get("picture");
    }

    @Override
    public boolean isEmailVerified() {
        // Google explicitly tells us if email is verified
        Boolean verified = (Boolean) attributes.get("email_verified");
        return verified != null && verified;
    }
}
```

#### 5.3.3 GitHubOAuth2UserInfo Implementation

**File:** `security/oauth2/GitHubOAuth2UserInfo.java`

```java
package com.reputeai.server.reputeai.security.oauth2;

import java.util.Map;

/**
 * Extracts user information from GitHub OAuth2 response.
 * 
 * GitHub User API Response:
 * {
 *   "id": 12345678,                          ← Unique GitHub user ID (numeric)
 *   "login": "johndoe",                       ← GitHub username
 *   "email": "john@example.com",              ← May be null if not public
 *   "name": "John Doe",                       ← Full name
 *   "avatar_url": "https://avatars.githubusercontent.com/..."
 * }
 * 
 * Important: GitHub email may be null if user hasn't made it public.
 * Must handle null email gracefully.
 * 
 * Documentation:
 * https://docs.github.com/en/rest/users/users#get-the-authenticated-user
 */
public class GitHubOAuth2UserInfo implements OAuth2UserInfo {

    private final Map<String, Object> attributes;

    public GitHubOAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public String getProviderId() {
        // GitHub's unique user ID - numeric "id" field
        // Convert to String for consistency
        Object id = attributes.get("id");
        return id != null ? String.valueOf(id) : null;
    }

    @Override
    public String getEmail() {
        // ⚠️ WARNING: May be null if user hasn't made email public
        // Must request "user:email" scope explicitly
        return (String) attributes.get("email");
    }

    @Override
    public String getFirstName() {
        // GitHub provides "name" field, not separate first/last
        // Split by space to get first name
        String name = (String) attributes.get("name");
        if (name != null && name.contains(" ")) {
            return name.split(" ")[0];
        }
        // Fallback to GitHub username if no full name
        return name != null ? name : (String) attributes.get("login");
    }

    @Override
    public String getLastName() {
        // Extract last name from full name
        String name = (String) attributes.get("name");
        if (name != null && name.contains(" ")) {
            String[] parts = name.split(" ");
            return parts.length > 1 ? parts[parts.length - 1] : "";
        }
        return "";
    }

    @Override
    public String getProfilePictureUrl() {
        return (String) attributes.get("avatar_url");
    }

    @Override