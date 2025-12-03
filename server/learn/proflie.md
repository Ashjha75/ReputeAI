



### **Application Workflow & API Implementation Sequence**

A developer should build these APIs in the following order, as each phase depends on the previous one being complete.

1.  **Phase 1: Platform Account Management:** The user must first connect their social media accounts. This involves the OAuth2 "dance" and APIs to manage these connections.
2.  **Phase 2: Data Ingestion & Analysis:** Once an account is connected, the user needs to trigger the process of fetching and analyzing their historical posts. This is an asynchronous workflow.
3.  **Phase 3: Content Review & Action:** After the data is analyzed, the user can view, inspect, and manage their posts through a rich, filterable interface. This is the core feature.
4.  **Phase 4: Dashboard & Summary:** Finally, an API is needed to provide a high-level overview of the user's status for the main dashboard.

---

### **Phase 1: Platform Account Management APIs**

**Goal:** Allow users to securely connect and manage their social media accounts using the industry-standard OAuth2 flow.

#### **API 1.1: Initiate OAuth2 Connection**

*   **Endpoint:** `GET /api/v1/platforms/connect/{platform}`
*   **Description:** Starts the OAuth2 connection flow by redirecting the user to the specified social media platform's authorization page.
*   **Implementation:** This endpoint will be handled by Spring Security's OAuth2 client. You only need to provide the correct link in your frontend. The backend configuration in `application.yml` drives the entire process.
*   **Permissions Required:** `account:create` (User must be logged in).
*   **UI Integration:** A user clicks a "Connect with Twitter" button. The frontend navigates the browser to `https://yourapp.com/api/v1/platforms/connect/twitter`.

##### Request Details
*   **Path Parameters:** `platform` (string): The platform to connect to (e.g., `twitter`, `github`).

##### Response Details
*   **Success Response (`302 Found` Redirect):** The response body is empty. The `Location` header contains the URL to the platform's authorization page, and the browser automatically redirects the user there.

#### **API 1.2: Handle OAuth2 Callback**

*   **Endpoint:** `GET /api/v1/platforms/callback/{platform}`
*   **Description:** This is the `redirect-uri` the platform sends the user back to. **It is not called by your frontend.** Spring Security's OAuth2 client intercepts this request, securely exchanges the temporary `code` for permanent access tokens, and then calls a custom `OAuth2SuccessHandler` where you will save the encrypted tokens to your `platform_account` table.
*   **Permissions Required:** `account:create` (User's session must persist).
*   **UI Integration:** The user's browser is sent here automatically. The backend then immediately redirects them to a results page in your UI.

##### Request Details
*   **Path Parameters:** `platform` (string): The platform sending the callback.
*   **Query Parameters (from platform):** `code` (string), `state` (string).

##### Response Details
*   **Success Response (`302 Found` Redirect):** Redirects to a frontend URL like `https://yourapp.com/settings/platforms?connect=success`.
*   **Failure Response (`302 Found` Redirect):** Redirects to a frontend URL like `https://yourapp.com/settings/platforms?connect=error`.

#### **API 1.3: List Connected Accounts**

*   **Endpoint:** `GET /api/v1/platforms`
*   **Description:** Fetches a list of all social media accounts currently connected by the authenticated user.
*   **Permissions Required:** `account:read`
*   **UI Integration:** Called when the user loads their "Settings -> Connected Accounts" page.

##### Response Details
*   **Success Response (`200 OK`):** A list of `PlatformAccountDto` objects.
    ```json
    [
      {
        "id": 1,
        "platformType": "TWITTER",
        "username": "@reputeai_user",
        "isConnected": true,
        "lastSyncedAt": "2025-11-16T18:00:00Z"
      }
    ]
    ```

#### **API 1.4: Disconnect a Platform Account**

*   **Endpoint:** `DELETE /api/v1/platforms/{accountId}`
*   **Description:** Deletes a connected account for the current user and revokes the stored tokens.
*   **Permissions Required:** `account:delete`
*   **UI Integration:** Called when the user clicks a "Disconnect" button.

##### Response Details
*   **Success Response (`200 OK`):** A standard `MessageResponseDto`.
    ```json
    { "success": true, "message": "Successfully disconnected the account." }
    ```

---

### **Phase 2: Data Ingestion & Analysis APIs**

**Goal:** Allow users to trigger the fetching and analysis of their content in a non-blocking, asynchronous way.

#### **API 2.1: Trigger Manual Ingestion**

*   **Endpoint:** `POST /api/v1/platforms/{accountId}/ingest`
*   **Description:** Kicks off a background job via SQS to fetch all historical posts for a specific platform account. This is a long-running process, so the API returns immediately with a job ID for status tracking.
*   **Permissions Required:** `analysis:run`
*   **UI Integration:** Called when a user clicks a "Scan Now" or "Fetch History" button for a connected account.

##### Response Details
*   **Success Response (`202 Accepted`):** A `JobStatusDto` object indicating the job has been queued.
    ```json
    {
      "jobId": "job-uuid-12345",
      "status": "QUEUED",
      "message": "Content ingestion job has been successfully queued."
    }
    ```

#### **API 2.2: Check Job Status**

*   **Endpoint:** `GET /api/v1/jobs/{jobId}`
*   **Description:** Allows the frontend to poll for the status of a long-running ingestion or analysis job.
*   **Permissions Required:** `analysis:run`
*   **UI Integration:** The frontend calls this endpoint periodically (e.g., every 5 seconds) after triggering an ingestion to update a progress indicator in the UI.

##### Response Details
*   **Success Response (`200 OK`):** An updated `JobStatusDto` object.
    ```json
    {
      "jobId": "job-uuid-12345",
      "status": "RUNNING", // or SUCCESS, FAILED
      "message": "Fetching posts from 2015-2018..."
    }
    ```

---

### **Phase 3: Content Review & Action APIs**

**Goal:** Provide the core, interactive workflow for users to review and manage their analyzed content.

#### **API 3.1: List Analyzed Posts**

*   **Endpoint:** `GET /api/v1/posts`
*   **Description:** The primary, powerful endpoint for fetching a paginated and filterable list of all posts for the user.
*   **Permissions Required:** `post:read`
*   **Implementation Note:** Use the JPA Criteria API to dynamically build the database query based on the optional query parameters.

##### Request Details
*   **Query Parameters (All Optional):** `page`, `size`, `sort`, `riskLevel`, `platformType`, `startDate`, `endDate`, `isIgnored`.

##### Response Details
*   **Success Response (`200 OK`):** A standard Spring `Page` object containing a list of `PostDto` objects.
    ```json
    {
      "content": [ { "id": 101, "platformType": "TWITTER", ... } ],
      "pageable": { ... },
      "totalElements": 98,
      ...
    }
    ```

#### **API 3.2: Get Post Details**

*   **Endpoint:** `GET /api/v1/posts/{postId}`
*   **Description:** Fetches all details for a single post, including the full AI analysis report.
*   **Permissions Required:** `post:read`
*   **UI Integration:** Called when a user clicks a post in a list to see more details in a modal or side panel.

##### Response Details
*   **Success Response (`200 OK`):** A `PostDetailDto` object.
    ```json
    {
      "id": 101,
      "fullContent": "...",
      "analysis": { "riskScore": 92, "riskLevel": "CRITICAL", ... }
    }
    ```

#### **API 3.3: Ignore a Post**

*   **Endpoint:** `POST /api/v1/posts/{postId}/ignore`
*   **Description:** Marks a post as "ignored," allowing users to hide it from their main review queue.
*   **Permissions Required:** `post:update`
*   **UI Integration:** Called when the user clicks an "Ignore" or "Mark as Safe" button.

##### Response Details
*   **Success Response (`200 OK`):** A standard `MessageResponseDto`.

#### **API 3.4: Delete a Post**

*   **Endpoint:** `DELETE /api/v1/posts/{postId}`
*   **Description:** Performs a **soft delete** on a post within the ReputeAI system for auditing.
*   **Permissions Required:** `post:delete`
*   **UI Integration:** Called when a user clicks a "Delete" button.

##### Response Details
*   **Success Response (`200 OK`):** A standard `MessageResponseDto`.

---

### **Phase 4: Dashboard & Summary API**

**Goal:** Provide a fast, high-level overview of the user's account status.

#### **API 4.1: Get Dashboard Summary**

*   **Endpoint:** `GET /api/v1/dashboard/summary`
*   **Description:** Fetches key aggregated metrics for the current user's dashboard.
*   **Permissions Required:** `user:read`
*   **Implementation Note:** This query should be highly optimized. Consider caching its result heavily.

##### Response Details
*   **Success Response (`200 OK`):** A `DashboardSummaryDto` object.
    ```json
    {
      "overallReputationScore": 75,
      "criticalAlertsCount": 12,
      "accountsConnected": 3,
      "totalPostsScanned": 4890
    }
    ```