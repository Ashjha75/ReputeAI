# Phase 1 Architecture Overview

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PHASE 1: PLATFORM ACCOUNT MANAGEMENT            │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Frontend   │
│  (React/Vue) │
└──────┬───────┘
       │
       │ 1. User clicks "Connect Twitter"
       │    GET /oauth2/authorization/twitter
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         Spring Security OAuth2 Client                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ SecurityConfig.java                                              │    │
│  │ - oauth2Login() configured                                       │    │
│  │ - Handles redirect to Twitter                                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────┬───────────────────────────────────────────────────────┘
                   │
                   │ 2. Redirect to Twitter with client_id & scopes
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         Twitter OAuth2 Server                             │
│  - User authorizes the app                                               │
│  - Twitter generates authorization code                                  │
└──────────────────┬───────────────────────────────────────────────────────┘
                   │
                   │ 3. Redirect back with code
                   │    GET /api/v1/platforms/callback/twitter?code=xxx
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                  PlatformOAuth2SuccessHandler.java                        │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ onAuthenticationSuccess()                                        │    │
│  │ 1. Extract OAuth2AuthorizedClient                               │    │
│  │ 2. Get access_token & refresh_token                             │    │
│  │ 3. Call PlatformAccountService.createOrUpdateAccount()          │    │
│  └─────────────────┬───────────────────────────────────────────────┘    │
└────────────────────┼──────────────────────────────────────────────────────┘
                     │
                     │ 4. Save encrypted tokens
                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    PlatformAccountService.java                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ createOrUpdateAccount()                                          │    │
│  │ - Create PlatformAccount entity                                  │    │
│  │ - Tokens auto-encrypted by EncryptedStringConverter             │    │
│  │ - Save to database via repository                                │    │
│  └─────────────────┬───────────────────────────────────────────────┘    │
└────────────────────┼──────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    JPA AttributeConverter                                 │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ EncryptedStringConverter.java                                    │    │
│  │ convertToDatabaseColumn():                                       │    │
│  │   - Calls EncryptionUtil.encrypt()                              │    │
│  │   - Uses AES-256-GCM                                             │    │
│  │   - Generates random IV per encryption                           │    │
│  └─────────────────┬───────────────────────────────────────────────┘    │
└────────────────────┼──────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         MySQL Database                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ platform_account table                                           │    │
│  │ ┌─────────────────────────────────────────────────────────┐     │    │
│  │ │ id: 1                                                    │     │    │
│  │ │ user_id: 123                                             │     │    │
│  │ │ platform_type: 'TWITTER'                                 │     │    │
│  │ │ external_account_id: 'twitter_user_12345'                │     │    │
│  │ │ username: '@john_doe'                                    │     │    │
│  │ │ access_token: 'zX9k2L...encrypted_base64...'  ← ENCRYPTED│     │    │
│  │ │ refresh_token: 'pQ7m5N...encrypted_base64...' ← ENCRYPTED│     │    │
│  │ │ token_expiry: '2025-12-03 18:00:00'                      │     │    │
│  │ │ is_connected: true                                       │     │    │
│  │ │ created_at: '2025-12-03 12:00:00'                        │     │    │
│  │ └─────────────────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘

                     │
                     │ 5. Redirect to frontend
                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│   Frontend: http://localhost:4200/oauth2/redirect?connect=success        │
│   - Shows success message                                                │
│   - Updates UI with connected account                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## API Flow - List Connected Accounts

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
       │ GET /api/v1/platforms
       │ Authorization: Bearer <jwt_token>
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      PlatformController.java                              │
│  @PreAuthorize("hasAuthority('account:read')")                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ listConnectedAccounts()                                          │    │
│  │ 1. Get current user from SecurityContext                        │    │
│  │ 2. Call service.listAccountsForUser(user)                       │    │
│  │ 3. Return List<PlatformAccountDto>                              │    │
│  └─────────────────┬───────────────────────────────────────────────┘    │
└────────────────────┼──────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                  PlatformAccountService.java                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ listAccountsForUser(User user)                                   │    │
│  │ 1. Query repository.findByUserAndIsConnectedTrue(user)          │    │
│  │ 2. Map entities to DTOs (excludes tokens)                       │    │
│  │ 3. Return DTOs                                                   │    │
│  └─────────────────┬───────────────────────────────────────────────┘    │
└────────────────────┼──────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         Response (JSON)                                   │
│  [                                                                        │
│    {                                                                      │
│      "id": 1,                                                             │
│      "platformType": "TWITTER",                                           │
│      "username": "@john_doe",                                             │
│      "isConnected": true,                                                 │
│      "lastSyncedAt": "2025-12-03T18:00:00Z",                             │
│      "createdAt": "2025-12-03T12:00:00Z"                                 │
│    }                                                                      │
│  ]                                                                        │
│  ⚠️ Note: access_token and refresh_token are NOT included                │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ENCRYPTION FLOW                                  │
└─────────────────────────────────────────────────────────────────────────┘

Plain Token                    Encryption Process              Database
─────────────────              ──────────────────              ─────────
                                                              
"ya29.a0AfH6..."  ──────────►  EncryptionUtil                 
                               ┌──────────────────────┐        
                               │ 1. Generate random   │        
                               │    12-byte IV        │        
                               │                      │        
                               │ 2. AES-256-GCM       │        
                               │    Cipher.encrypt()  │        
                               │                      │        
Environment Variable           │ 3. IV + Ciphertext   │        "zX9k2L8pQ..."
┌──────────────────┐          │    + Auth Tag        │  ───►  (Base64)
│ PLATFORM_        │  ───────►│                      │        STORED
│ ENCRYPTION_KEY   │          │ 4. Base64 encode     │        
│ (32 bytes)       │          └──────────────────────┘        
└──────────────────┘                                           
     ↓                                                         
     │                        ┌──────────────────────┐        
     │                        │ Decryption Process   │        
     │                        │                      │        
     └────────────────────────│ 1. Base64 decode     │        
                              │ 2. Extract IV        │        
                              │ 3. AES-256-GCM       │        
                              │    Cipher.decrypt()  │        
                              │ 4. Verify auth tag   │        
                              └──────────────────────┘        
                                        │                     
                                        ▼                     
                               "ya29.a0AfH6..."              
                               (Original token)              

Benefits:
✅ Confidentiality - Token contents hidden
✅ Integrity - Tampering detected via auth tag
✅ Unique IV - Each encryption uses different IV
✅ Key Rotation - Can re-encrypt with new key
```

---

## Component Relationships

```
┌────────────────────────────────────────────────────────────────┐
│                     Component Diagram                          │
└────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       Controller Layer                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PlatformController                                        │  │
│  │ - GET /api/v1/platforms                                   │  │
│  │ - DELETE /api/v1/platforms/{id}                           │  │
│  └────────────────────┬─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                        │
                        │ depends on
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Service Layer                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PlatformAccountService (interface)                        │  │
│  │ - createOrUpdateAccount()                                 │  │
│  │ - listAccountsForUser()                                   │  │
│  │ - deleteAccount()                                         │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PlatformAccountServiceImpl                                │  │
│  │ - Business logic                                          │  │
│  │ - Validation                                              │  │
│  └────────────────────┬─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                        │
                        │ depends on
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Repository Layer                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PlatformAccountRepository (JpaRepository)                 │  │
│  │ - findByUserAndIsConnectedTrue()                          │  │
│  │ - findByIdAndUser()                                       │  │
│  └────────────────────┬─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                        │
                        │ persists
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Entity Layer                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PlatformAccount                                           │  │
│  │ - @Convert(converter = EncryptedStringConverter.class)   │  │
│  │ - accessToken (encrypted)                                 │  │
│  │ - refreshToken (encrypted)                                │  │
│  └────────────────────┬─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                        │
                        │ uses
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Utility Layer                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ EncryptedStringConverter (AttributeConverter)             │  │
│  │ - convertToDatabaseColumn()                               │  │
│  │ - convertToEntityAttribute()                              │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ EncryptionUtil                                            │  │
│  │ - encrypt() → AES-256-GCM                                 │  │
│  │ - decrypt() → AES-256-GCM                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                     Database Schema                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐
│         app_user                  │
├───────────────────────────────────┤
│ id (PK)                           │
│ email                             │
│ first_name                        │
│ last_name                         │
│ ...                               │
└─────────────┬─────────────────────┘
              │
              │ 1:N
              │
              ▼
┌──────────────────────────────────────────────────────────────┐
│         platform_account                                      │
├───────────────────────────────────────────────────────────────┤
│ id (PK)                                                       │
│ user_id (FK) ────────────────────┐                           │
│ platform_type                     │  UNIQUE constraint:       │
│ external_account_id               │  (user_id,                │
│ username                          │   platform_type,          │
│ access_token (ENCRYPTED) ← TEXT   │   external_account_id)    │
│ refresh_token (ENCRYPTED) ← TEXT  │                           │
│ token_expiry                      │                           │
│ is_connected                      │                           │
│ last_synced_at                    │                           │
│ metadata (JSON)                   │                           │
│ created_at                        │                           │
│ updated_at                        │                           │
└───────────────────────────────────────────────────────────────┘

Indexes:
- PRIMARY KEY (id)
- INDEX idx_platform_user (user_id)
- INDEX idx_platform_type (platform_type)
- INDEX idx_platform_connected (is_connected)

Example Data:
┌────┬─────────┬──────────┬──────────────────┬────────────┬─────────────────┐
│ id │ user_id │ platform │ external_id      │ username   │ is_connected    │
├────┼─────────┼──────────┼──────────────────┼────────────┼─────────────────┤
│ 1  │ 123     │ TWITTER  │ twitter_user_123 │ @john_doe  │ true            │
│ 2  │ 123     │ GITHUB   │ github_user_456  │ johndoe    │ true            │
│ 3  │ 456     │ TWITTER  │ twitter_user_789 │ @jane_doe  │ false           │
└────┴─────────┴──────────┴──────────────────┴────────────┴─────────────────┘
```

---

## OAuth2 Flow Sequence

```
User         Frontend       Backend          Twitter        Database
 │              │              │                │                │
 │ Click        │              │                │                │
 │"Connect"     │              │                │                │
 │──────────────►              │                │                │
 │              │ GET /oauth2/ │                │                │
 │              │ authorization│                │                │
 │              │ /twitter     │                │                │
 │              ──────────────►│                │                │
 │              │              │ 302 Redirect   │                │
 │              │              │ to Twitter     │                │
 │              │              ├───────────────►│                │
 │◄─────────────┼──────────────┤                │                │
 │ Redirected to Twitter       │                │                │
 │──────────────────────────────────────────────►                │
 │              │              │                │                │
 │ Authorize    │              │                │                │
 │──────────────────────────────────────────────►                │
 │              │              │                │                │
 │              │              │◄───────────────┤                │
 │              │              │ callback?code= │                │
 │              │              │                │                │
 │              │              │ Exchange code  │                │
 │              │              │ for token      │                │
 │              │              ├───────────────►│                │
 │              │              │                │                │
 │              │              │◄───────────────┤                │
 │              │              │ access_token   │                │
 │              │              │ refresh_token  │                │
 │              │              │                │                │
 │              │              │ Encrypt tokens │                │
 │              │              │ & Save         │                │
 │              │              ├───────────────────────────────►│
 │              │              │                │   INSERT       │
 │              │              │                │   encrypted    │
 │              │              │                │   tokens       │
 │              │              │                │                │
 │              │              │ 302 Redirect   │                │
 │              │◄─────────────┤ to frontend    │                │
 │◄─────────────┤              │ ?connect=      │                │
 │ Success!     │              │ success        │                │
 │              │              │                │                │
```

---

This architecture ensures:
✅ Secure token storage with encryption
✅ Separation of concerns (MVC pattern)
✅ OAuth2 standard compliance
✅ Scalable for multiple platforms
✅ User isolation and security

