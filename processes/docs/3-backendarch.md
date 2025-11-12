
Below is a complete, production-ready **backend project structure** for ReputeAI (Spring Boot latest).  
Tree first. Then for each folder I list files you should create and short, actionable notes: what it is, why it exists, and minimal implementation pointers a 2-year dev can follow.

# Project tree (dotted format)

```
├── backend/
│   ├── pom.xml
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── README.md
│   ├── .github/workflows/ci.yml
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/reputeai/
│   │   │   │       ├── ReputeApiApplication.java
│   │   │   │       ├── api/
│   │   │   │       │   ├── controller/
│   │   │   │       │   │   ├── AuthController.java
│   │   │   │       │   │   ├── UserController.java
│   │   │   │       │   │   ├── AccountController.java
│   │   │   │       │   │   ├── PostController.java
│   │   │   │       │   │   └── AdminController.java
│   │   │   │       │   └── dto/
│   │   │   │       │       ├── dto package (UserDto, LoginRequest, PostDto, etc.)
│   │   │   │       ├── service/
│   │   │   │       │   ├── AuthService.java
│   │   │   │       │   ├── UserService.java
│   │   │   │       │   ├── AccountService.java
│   │   │   │       │   ├── IngestService.java
│   │   │   │       │   ├── AnalysisService.java
│   │   │   │       │   ├── WorkflowService.java
│   │   │   │       │   └── implementation subpackages as needed
│   │   │   │       ├── repo/
│   │   │   │       │   ├── UserRepository.java
│   │   │   │       │   ├── PlatformAccountRepository.java
│   │   │   │       │   ├── PlatformPostRepository.java
│   │   │   │       │   ├── AnalysisResultRepository.java
│   │   │   │       │   ├── JobRepository.java
│   │   │   │       │   └── AuditLogRepository.java
│   │   │   │       ├── domain/
│   │   │   │       │   ├── entity classes (User, PlatformAccount, PlatformPost, AnalysisResult, Job, AuditLog, Role, Permission)
│   │   │   │       ├── security/
│   │   │   │       │   ├── JwtProvider.java
│   │   │   │       │   ├── JwtAuthenticationFilter.java
│   │   │   │       │   ├── SecurityConfig.java
│   │   │   │       │   ├── OAuthConnectorService.java
│   │   │   │       │   └── model (AuthenticatedUser)
│   │   │   │       ├── integration/
│   │   │   │       │   ├── connector/
│   │   │   │       │   │   ├── Connector.java
│   │   │   │       │   │   ├── TwitterConnector.java
│   │   │   │       │   │   ├── LinkedInConnector.java
│   │   │   │       │   │   └── GitHubConnector.java
│   │   │   │       │   └── dto (ConnectorPost.java)
│   │   │   │       ├── jobs/
│   │   │   │       │   ├── FetchScheduler.java
│   │   │   │       │   ├── AnalysisWorker.java
│   │   │   │       │   └── CleanupJob.java
│   │   │   │       ├── config/
│   │   │   │       │   ├── AppConfig.java
│   │   │   │       │   ├── CacheConfig.java
│   │   │   │       │   ├── WebMvcConfig.java
│   │   │   │       │   └── AwsConfig.java
│   │   │   │       ├── util/
│   │   │   │       │   ├── Mapper.java (MapStruct interfaces)
│   │   │   │       │   ├── IdempotencyUtils.java
│   │   │   │       │   └── RequestContext.java (correlation ids)
│   │   │   │       └── exception/
│   │   │   │           ├── GlobalExceptionHandler.java
│   │   │   │           ├── ApiError.java
│   │   │   │           └── custom exceptions
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-local.yml
│   │   │       ├── logback-spring.xml
│   │   │       └── db/migration/
│   │   │           ├── V1__init.sql
│   │   │           └── V2__add_analysis_tables.sql
│   │   └── test/
│   │       ├── java/com/reputeai/
│   │       │   ├── unit tests (service/controller)
│   │       │   └── integration tests (Testcontainers)
│   └── build scripts / tools (Makefile, scripts/)

```

----------

# Folder-by-folder: files, purpose, minimal implementation notes

I'll go folder by folder. Each entry: **What it is**, **Why**, **How to implement (practical)**.

----------

## Top-level files

-   **pom.xml**
    
    -   What: Maven project definition.
        
    -   Why: Manage dependencies (Spring Boot starters, MapStruct, Resilience4j, Testcontainers, Micrometer).
        
    -   How: Use parent `spring-boot-starter-parent`; define properties `java.version=17`. Add plugins: `spring-boot-maven-plugin`, `maven-compiler-plugin`, `mapstruct`.
        
-   **Dockerfile**
    
    -   What: Multi-stage build for container image.
        
    -   Why: Build reproducible runtime image for ECS/ECR.
        
    -   How: Build stage runs `mvn -DskipTests package`. Runtime uses JRE image. Expose 8080.
        
-   **docker-compose.yml**
    
    -   What: Local dev composition (mysql, redis, backend).
        
    -   Why: Easy local dev and integration tests.
        
    -   How: Use `depends_on` and env files. Keep DB passwords in `.env` (not in repo).
        
-   **.github/workflows/ci.yml**
    
    -   What: CI pipeline (build, test, static analysis).
        
    -   Why: ensure PR quality.
        
    -   How: Run `mvn -DskipTests=false test`, run SpotBugs, publish to registry on merge.
        
-   **README.md**
    
    -   What: Repo instructions (you already have a version).
        
    -   Why: onboarding for devs.
        
    -   How: Keep updated with run steps and env var list.
        

----------

## `ReputeApiApplication.java`

-   What: Spring Boot main class.
    
-   Why: Bootstraps Spring context and starts app.
    
-   How: Annotate with `@SpringBootApplication`. If using OpenTelemetry, initialize tracer here.
    

----------

## `api/controller/` — controllers

Files: `AuthController.java`, `UserController.java`, `AccountController.java`, `PostController.java`, `AdminController.java`

-   **What**: REST endpoints entry points.
    
-   **Why**: Expose HTTP API; keep controllers thin.
    
-   **How**:
    
    -   Use `@RestController` and `@RequestMapping("/api/v1/...")`.
        
    -   Validate inputs with `@Valid`.
        
    -   Return `ResponseEntity<T>` with appropriate status codes.
        
    -   Use DTOs; never return JPA entities.
        
    -   Add `@Operation` for Swagger if using OpenAPI.
        

Endpoints examples (routes you will implement):

-   `POST /api/v1/auth/login` -> login
    
-   `POST /api/v1/auth/oauth/callback` -> platform token exchange
    
-   `GET /api/v1/users/{id}` -> user profile
    
-   `POST /api/v1/accounts/{accountId}/fetch` -> manual fetch
    
-   `GET /api/v1/posts` -> list with `page,size,sort`
    
-   `GET /api/v1/posts/{id}` -> single post + analysis
    
-   `POST /api/v1/admin/reprocess/{postId}` -> admin re-analysis
    

----------

## `api/dto/` — DTOs

Files: `UserDto.java`, `LoginRequest.java`, `LoginResponse.java`, `PostDto.java`, `AnalysisResultDto.java`, `PagedResponse.java`, etc.

-   **What**: Request and response schemas.
    
-   **Why**: Decouple API from persistence.
    
-   **How**:
    
    -   Use Lombok `@Data` or explicit getters/setters.
        
    -   Use validation annotations: `@NotNull`, `@Size`, `@Email`.
        
    -   Provide MapStruct mappers for entity<->dto conversion.
        

----------

## `service/` — business logic

Files: `AuthService.java`, `UserService.java`, `AccountService.java`, `IngestService.java`, `AnalysisService.java`, `WorkflowService.java`

-   **What**: Core business rules and orchestration.
    
-   **Why**: Keeps controllers thin and testable.
    
-   **How**:
    
    -   Use interfaces + `@Service` implementations.
        
    -   Methods transactional where needed: `@Transactional` on write ops.
        
    -   Avoid exposing JPA entities outside service boundary.
        
    -   Unit test services with Mockito.
        

Important patterns:

-   Keep each service focused (single responsibility).
    
-   Use `@Transactional(readOnly = true)` for read methods.
    

----------

## `repo/` — JPA repositories

Files: `UserRepository.java`, `PlatformAccountRepository.java`, `PlatformPostRepository.java`, `AnalysisResultRepository.java`, `JobRepository.java`, `AuditLogRepository.java`

-   **What**: Spring Data JPA interfaces.
    
-   **Why**: Abstract DB access.
    
-   **How**:
    
    -   Extend `JpaRepository<Entity, Long>`.
        
    -   Add custom queries with `@Query` or query methods when needed.
        
    -   Use projections or DTO interfaces for heavy queries.
        
    -   Keep complex queries in `@Repository` custom implementation if needed.
        

----------

## `domain/` — entities

Files: `User.java`, `Role.java`, `Permission.java`, `PlatformAccount.java`, `PlatformPost.java`, `AnalysisResult.java`, `Job.java`, `AuditLog.java`

-   **What**: JPA entity classes representing DB.
    
-   **Why**: Persist app state.
    
-   **How**:
    
    -   Use `@Entity`, `@Table`, consistent PK (`@Id` with `@GeneratedValue`).
        
    -   Common audit fields: `createdAt`, `updatedAt`, `createdBy`. Use `@CreationTimestamp` / `@UpdateTimestamp` or set in code.
        
    -   Avoid storing large blobs in main table. Use S3 references for raw payloads.
        
    -   Add unique constraints for `platform + externalId`.
        

Example minimal `PlatformPost` fields:

-   `id`, `platform`, `externalId`, `accountId`, `content`, `createdAt`, `fetchedAt`, `isDeleted`.
    

----------

## `security/`

Files: `JwtProvider.java`, `JwtAuthenticationFilter.java`, `SecurityConfig.java`, `OAuthConnectorService.java`, `AuthenticatedUser.java`, `TokenService.java`

-   **What**: Security components and config.
    
-   **Why**: Auth, authorization, token lifecycle.
    
-   **How**:
    
    -   Use Spring Security 6 config with bean `SecurityFilterChain` in `SecurityConfig`.
        
    -   `JwtProvider` handles token creation/validation (HMAC or RSA).
        
    -   `JwtAuthenticationFilter` extracts JWT from `Authorization` header, sets `SecurityContext`.
        
    -   `OAuthConnectorService` handles storing platform tokens, refresh flow.
        
    -   Protect endpoints by roles with `@PreAuthorize("hasRole('ADMIN')")` or method-level checks.
        

Notes:

-   Use short-lived access tokens + refresh tokens persisted encrypted.
    
-   Store third-party OAuth tokens in Secrets Manager in prod or encrypted DB column.
    

----------

## `integration/connector/`

Files: `Connector.java` (interface), `TwitterConnector.java`, `LinkedInConnector.java`, `GitHubConnector.java`, `ConnectorClientFactory.java`, DTO `ConnectorPost.java`

-   **What**: Platform adapters that fetch posts.
    
-   **Why**: Encapsulate platform-specific logic and rate-limits.
    
-   **How**:
    
    -   Define `Connector` interface with methods: `List<ConnectorPost> fetchPosts(account, since)`, `refreshTokens(...)`.
        
    -   Implement per-platform connectors using their SDKs or REST clients.
        
    -   Use RestTemplate/WebClient with resiliency (Resilience4j).
        
    -   Respect platform rate limits and use backoff.
        

----------

## `jobs/`

Files: `FetchScheduler.java`, `AnalysisWorker.java`, `CleanupJob.java`, `JobDispatcher.java`

-   **What**: Background scheduled tasks and queue workers.
    
-   **Why**: Async ingestion, analysis, cleanup.
    
-   **How**:
    
    -   Scheduler triggers via `@Scheduled` or via SQS triggers.
        
    -   Workers poll SQS or DB queue and process messages.
        
    -   Persist job attempts and errors in `Job` table. Implement exponential backoff.
        
    -   Ensure idempotency and visibility timeout semantics if using SQS.
        

----------

## `config/`

Files: `AppConfig.java`, `CacheConfig.java`, `WebMvcConfig.java`, `AwsConfig.java`, `OpenApiConfig.java`

-   **What**: Spring configuration beans.
    
-   **Why**: Centralize framework settings.
    
-   **How**:
    
    -   `CacheConfig` configures Spring Cache with Redis.
        
    -   `WebMvcConfig` sets CORS, interceptors (correlation id), resource handlers.
        
    -   `AwsConfig` creates Beans for S3Client, SQSClient, SecretsManagerClient (use AWS SDK v2).
        
    -   `OpenApiConfig` enables Swagger UI only in dev profile.
        

----------

## `util/`

Files: `Mapper.java` (MapStruct interfaces), `IdempotencyUtils.java`, `RequestContext.java` (stores trace id), `TimeUtils.java`

-   **What**: Small helpers used across app.
    
-   **Why**: Reuse common logic; keep services cleaner.
    
-   **How**:
    
    -   Implement correlation-id filter that sets `RequestContext.traceId`.
        
    -   `IdempotencyUtils` implements idempotency key check via Redis.
        

----------

## `exception/`

Files: `GlobalExceptionHandler.java`, `ApiError.java`, `NotFoundException.java`, `BadRequestException.java`, `UnauthorizedException.java`

-   **What**: Centralized error handling.
    
-   **Why**: Consistent API error responses and status codes.
    
-   **How**:
    
    -   `@ControllerAdvice` with handlers for `MethodArgumentNotValidException`, custom exceptions, and generic `Exception`.
        
    -   Return `ApiError` JSON: `{code, message, details, traceId}`.
        

----------

## `resources/`

Files: `application.yml`, `application-local.yml`, `logback-spring.xml`, `db/migration/V1__init.sql`, `db/migration/V2__add_analysis_tables.sql`, `keystore/` (if needed)

-   **application.yml**
    
    -   Profiles: `local`, `dev`, `staging`, `prod`.
        
    -   Externalize sensitive values via environment variables.
        
    -   `spring.jpa.hibernate.ddl-auto: validate` for prod.
        
-   **logback-spring.xml**
    
    -   Configure JSON/structured logs and include `${X-Trace-Id}` MDC.
        
-   **Flyway scripts**
    
    -   Keep schema changes versioned and small. Each script adds one feature.
        

----------

## `test/`

-   Unit tests: `UserServiceTest`, `AuthServiceTest` using Mockito.
    
-   Integration tests: `ControllerIntegrationTest` using Spring Boot Test + Testcontainers for MySQL and Redis.
    
-   Contract tests: connector mocks verifying expected requests.
    
-   Keep tests fast and reliable.
    

----------

## Additional files / folders

-   **scripts/**
    
    -   `run-local.sh`, `migrate-db.sh`, `bootstrap-secrets.sh`.
        
-   **Makefile**
    
    -   commands: `make build`, `make run-local`, `make test`.
        
-   **ci/** (optional)
    
    -   scripts for pipelines.
        

----------

# Minimal implementation tips and conventions (practical rules)

1.  **Package by feature** not by layer when features grow (e.g., `user/` containing controller/service/repo/domain). Start layered for clarity then refactor.
    
2.  **DTOs only across network boundary**. Entities never leave service.
    
3.  **Transactions** on service methods. Keep them short.
    
4.  **Log useful context** (traceId, userId, accountId) with each log line. Use MDC.
    
5.  **Idempotency** for external-facing write operations. Use Redis or database unique constraints.
    
6.  **Resilience**: wrap connector calls with Resilience4j retry/circuit-breaker and fallback.
    
7.  **Secrets**: never in repo. Use local `secrets.env` for dev and AWS Secrets Manager for prod.
    
8.  **Migration first**: every schema change must have Flyway script and migration tested on CI.
    
9.  **API versioning**: include `/api/v1/...` in all routes.
    
10.  **Feature toggles**: add simple `feature_flags` table early to avoid code toggles.
    

----------

# Next steps I can produce (pick one or more)

-   Generate file stubs for the entire tree with minimal code (main classes, controllers, DTOs, entities, repos).
    
-   Produce `V1__init.sql` schema script for the core tables.
    
-   Provide a sample `SecurityConfig.java` + `JwtProvider.java` pair.
    
-   Create a ready-to-run `docker-compose.yml` for local dev (mysql, redis, backend).
    

Tell me which artifact to generate first and I will produce it now.