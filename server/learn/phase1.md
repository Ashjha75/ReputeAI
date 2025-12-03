

### **Developer's Step-by-Step Guide to Implementing Phase 1**

#### **Step 1: Configure Your OAuth2 Providers in `application.yml and other yml propertiest`**

**Goal:** Tell Spring Security about the platforms you want to support (Twitter, GitHub, etc.) and provide your application's credentials.

*   **Action:**
    1.  Go to the developer portal for each platform (e.g., Twitter Developer Portal, GitHub Developer Apps).
    2.  Register your "ReputeAI" application. During registration, you will be asked for a **"Redirect URI"** or **"Callback URL"**. For each platform, provide the full URL to your backend's callback endpoint.
        *   For Twitter: `https://your-backend-domain.com/api/v1/platforms/callback/twitter`
        *   For GitHub: `https://your-backend-domain.com/api/v1/platforms/callback/github`
    3.  The platform will give you a **Client ID** and a **Client Secret**.
    4.  Open your `application.yml` file and add these credentials under the `spring.security.oauth2.client.registration` path as documented. This configuration is the foundation for the entire feature.

---

#### **Step 2: Create the `PlatformAccount` Entity and Migration**

**Goal:** Create the database table to securely store the connection details and tokens for each user.

*   **Action:**
    1.  Create a new JPA entity class named `PlatformAccount.java` in your `domain.entity` package.
    2.  Define its fields: a `@ManyToOne` relationship to your `User` entity, `platformType` (String), `externalAccountId` (String), `username` (String), `accessToken` (String), `refreshToken` (String), and `tokenExpiry` (Instant).
    3.  **Crucial Security Step:** The `accessToken` and `refreshToken` fields contain highly sensitive credentials. You **must not** store them as plaintext. Create a JPA `AttributeConverter` that uses a strong encryption library (like Jasypt or a custom service using AWS KMS) to automatically encrypt these fields before saving them to the database and decrypt them when they are read.
    4.  Create a new Flyway migration file (e.g., `V5__Create_Platform_Account_Table.sql`) to add the `platform_account` table to your database schema.

---

#### **Step 3: Configure the `SecurityFilterChain` for OAuth2**

**Goal:** Enable Spring Security's built-in OAuth2 client and tell it how to handle a successful login.

*   **Action:**
    1.  Open your `SecurityConfig.java` file.
    2.  In your `securityFilterChain` bean, add the `.oauth2Login()` configuration.
    3.  Inside the `oauth2Login` configuration, you will specify a custom **`successHandler`**. This is the most important part. It tells Spring Security: "After you successfully handle the OAuth2 dance and get the tokens, call *my* custom class to finish the process."
    4.  You will also specify a custom `failureHandler` to redirect the user to a frontend error page if the OAuth2 flow fails for any reason.

---

#### **Step 4: Implement the Custom `OAuth2SuccessHandler`**

**Goal:** This class is the bridge between Spring Security's automated flow and your application's business logic. It's responsible for saving the user's new connection.

*   **Action:**
    1.  Create a new class `CustomOAuth2SuccessHandler.java` in your `security` package. It must implement Spring's `AuthenticationSuccessHandler` interface.
    2.  Implement the `onAuthenticationSuccess` method. Inside this method, you will perform these steps:
        a. Get the currently authenticated ReputeAI user from the `SecurityContextHolder`. This is the user who initiated the connection.
        b. Get the `OAuth2User` object from the `Authentication` principal. This object contains the details returned by the platform (e.g., their GitHub username, ID).
        c. Get the `OAuth2AuthorizedClient` from the authorized client service. This object contains the precious **access token** and **refresh token** that you need to save.
        d. Call a new `PlatformAccountService` (which you will create in the next step), passing it the ReputeAI user and all the details you just gathered (tokens, external username, etc.).
        e. Finally, perform a redirect to your frontend's success page, for example: `http://localhost:4200/settings/platforms?connect=success`.

---

#### **Step 5: Create the `PlatformAccountService`**

**Goal:** To contain all the business logic for managing platform accounts, keeping your `SuccessHandler` clean and your logic testable.

*   **Action:**
    1.  Create a `PlatformAccountService` interface and its implementation, `PlatformAccountServiceImpl`.
    2.  Create a method like `createOrUpdateAccount(User user, String platformType, String externalUsername, String accessToken, String refreshToken, Instant expiry)`. This method will handle the logic of creating a new `PlatformAccount` entity, calling your encryption converter on the tokens, and saving it to the database.
    3.  Create a method `listAccountsForUser(User user)` for API 1.3. This will query the `PlatformAccountRepository` for all accounts linked to the user.
    4.  Create a method `deleteAccount(Long accountId, User user)` for API 1.4. This will find the account, verify that it belongs to the current user (for security), and then delete it.

---

#### **Step 6: Create the `PlatformController`**

**Goal:** Expose the management APIs (`list` and `delete`) to the frontend. Note: The OAuth2 `connect` and `callback` endpoints are handled automatically by Spring Security and do not go in this controller.

*   **Action:**
    1.  Create a new `PlatformController.java`.
    2.  Create the `GET /api/v1/platforms` endpoint. Protect it with `@PreAuthorize("hasAuthority('account:read')")`. This method will get the current user from the `SecurityContext` and call `platformAccountService.listAccountsForUser()`.
    3.  Create the `DELETE /api/v1/platforms/{accountId}` endpoint. Protect it with `@PreAuthorize("hasAuthority('account:delete')")`. This method will get the current user and call `platformAccountService.deleteAccount()`.

---

#### **Step 7: Create the `PlatformAccountDto`**

**Goal:** Define the JSON structure for the `GET /api/v1/platforms` response.

*   **Action:**
    1.  Create the `PlatformAccountDto.java` class in your `dto` package.
    2.  Define the fields as specified in the API documentation: `id`, `platformType`, `username`, `isConnected`, `lastSyncedAt`.
    3.  Update your `ApplicationMapper` interface to add a method for converting a `PlatformAccount` entity into this `PlatformAccountDto`.

By following these seven steps in order, you will have a complete, secure, and professional implementation of the entire platform connection workflow.