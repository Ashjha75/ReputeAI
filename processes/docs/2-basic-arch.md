

# Core stack & versions

1. Spring Boot (3.x) — Web + Data JPA + Security starters.
2. Java 17 (LTS) or 21 if you prefer latest LTS.
3. MySQL (JPA/Hibernate) + Flyway for migrations.
4. Redis (ElastiCache) for caching & rate counters.
5. Docker for containerization.
6. Git (branching + PR flow).

# Project structure (modular monolith)

```
/src
  /main
    /java/com/reputeai
      /api        -> controllers/DTOs
      /service    -> business logic
      /domain     -> entities
      /repo       -> Spring Data repositories
      /config     -> Spring configs
      /jobs       -> scheduled / async workers
      /integration-> platform connector adapters
      /security   -> auth, jwt, filters
    /resources
      application.yml
      logback-spring.xml
  /test
```

# Mandatory coding features (must-have)

1. **DTOs + Mappers**

   * Use MapStruct or manual mappers. Prevent exposing JPA entities via APIs.
2. **Validation**

   * javax.validation (Bean Validation) on DTOs. Fail-fast. Clear error responses.
3. **Exception handling**

   * `@ControllerAdvice` with structured error body (code, message, details).
4. **Repository patterns**

   * Spring Data JPA with explicit queries for heavy operations. Use projections for wide rows.
5. **Migrations**

   * Flyway scripts (V1__init.sql...). Run at startup in CI/CD check.
6. **Transactions**

   * Use `@Transactional` at service layer. Keep transactions short.
7. **Pagination & sorting**

   * Use Spring Data `Pageable` for all list endpoints. No unbounded queries.
8. **Pagination-friendly deletes/cleanup**

   * Process large deletes in batches to avoid locks.
9. **Idempotency**

   * Idempotent endpoints for bulk operations. Use unique request-id header.
10. **Audit fields**

    * `created_at`, `updated_at`, `created_by`, store external ids.

# Security (must-have)

1. **Auth** — OAuth2/OIDC for platform integrations; JWT for internal API sessions.
2. **RBAC** — roles: USER, ADMIN, AUDITOR. Enforce at service layer, not only controllers.
3. **Secrets** — don’t store tokens in DB plaintext; use AWS Secrets Manager or encrypt value.
4. **Input sanitization** — defensively handle HTML, markdown, and code in posts.
5. **Rate limit** — Bucket4j or Redis-based counters for heavy endpoints.
6. **CORS** — explicit whitelists per env.

# Observability & ops (must-have)

1. **Logging**

   * SLF4J + Logback. Structured JSON logs. Correlation ID per request (`X-Request-ID`).
   * Example: `logback-spring.xml` with patterns and rolling file appender.
2. **Tracing & metrics**

   * OpenTelemetry instrumentation + Micrometer. Expose `/actuator/prometheus`.
3. **Health & readiness**

   * Spring Boot Actuator: health, db, disk, queue checks.
4. **Metrics**

   * Track queue depth, AI request count, token usage, RDS connections, cache hit-rate.
5. **Monitoring**

   * CloudWatch / Prometheus + Grafana dashboards.

# Caching & performance (important)

1. **Cache** — Spring Cache abstraction with Redis. Cache analysis results TTL (per policy).
2. **Second-level cache** — optional Hibernate L2 for read-heavy lookups.
3. **Query tuning** — add indexes; use explain to check heavy queries.
4. **Read replicas** — read-only queries route to replicas.

# Resilience patterns (important)

1. **Retries & backoff** — Resilience4j for retries, circuit-breaker, rate-limiters.
2. **Bulkhead** — isolate AI calls from user-facing APIs.
3. **Queueing** — SQS/SQS-like for ingestion and async analysis jobs.

# Background jobs & batch (important)

1. **Scheduler** — Spring `@Scheduled` or Quartz for periodic fetches.
2. **Worker model** — lightweight worker processes reading SQS or DB queue.
3. **Job metadata** — table `jobs` with status, attempts, last_error, next_attempt.
4. **Idempotent job processing** — use dedupe keys.

# Integrations (platform connectors)

1. **Connector adapter pattern** — one interface, multiple platform implementations.
2. **Rate-limit adapter** — per-connector throttling config.
3. **OAuth token lifecycle** — refresh token handling, revoke logic, token expiry background job.
4. **Retry semantics** — exponential backoff for 429/5xx.

# AI integration (practical dev)

1. **Adapter/Provider interface** — abstract provider calls; implement Google Gemini adapter later.
2. **Batch requests** — group posts into batches to reduce cost.
3. **Store raw response** — for audits and reprocessing.
4. **Quota guard** — circuit break and stall if cost threshold passed.

# Data retention & privacy (must-code)

1. **Soft delete + purge** — soft-delete flag and scheduled purge job with audit trail.
2. **Export & delete endpoints** — implement GDPR right-to-be-forgotten flows.
3. **Audit log writes** — append-only audit table for sensitive actions.

# Testing (must-have)

1. **Unit tests** — JUnit 5 + Mockito. Cover services and mappers.
2. **Integration tests** — Testcontainers for MySQL, Redis.
3. **Contract tests** — for connectors and AI provider (mocked).
4. **E2E / smoke** — basic flows against staging.
5. **Load tests** — k6 or Gatling for ingestion and analysis throughput.

# CI/CD & Git workflows (must-have)

1. **Branching** — `main` (protected), `develop`, feature branches, PR + reviews.
2. **Checks on PR** — formatting, mvn test, static analysis (SpotBugs/PMD), dependency scan.
3. **Pipeline**

   * Build → unit tests → static analysis → build docker image → push to registry.
   * Deploy pipeline (staging) runs DB migrations (Flyway) in pre-check mode then deploy.
4. **Rollback** — image tags + previous DB schema backup plan.

# Docker & containerization (must-have)

1. **Dockerfile** (slim, multi-stage):

```dockerfile
FROM eclipse-temurin:17-jdk-jammy as build
WORKDIR /app
COPY mvnw pom.xml ./
COPY . .
RUN ./mvnw -DskipTests package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/app.jar /app/app.jar
ENV JAVA_OPTS="-Xms512m -Xmx1024m -Dspring.profiles.active=prod"
EXPOSE 8080
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]
```

2. Keep image under 300MB. Avoid secrets in images.

# Configuration management (must-have)

1. **application.yml** profiles: `local`, `staging`, `prod`.
2. **Externalize secrets**: use Secrets Manager / Vault.
3. **Feature flags**: LaunchDarkly or simple DB toggles for turning features off.

# Dependency & vulnerability management

1. Dependabot / Renovate for deps.
2. Snyk or OWASP dependency-check in CI.

# Documentation & API contract (must-have)

1. **OpenAPI / Swagger** generated from controllers.
2. Postman collection or Insomnia export.
3. README with run steps, env vars, example curl flows.
4. Architecture README showing modules and data flow.

# Sample small configs (copy/paste)

**application.yml (snippet)**

```yaml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST}:${DB_PORT}/repute
    username: ${DB_USER}
    password: ${DB_PASS}
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        format_sql: false
        jdbc:
          lob:
            non_contextual_creation: true
flyway:
  enabled: true
  locations: classpath:db/migration
```

**logback-spring.xml (snippet)**

```xml
<configuration>
  <property name="LOG_PATTERN" value="%d{yyyy-MM-dd HH:mm:ss.SSS} [%X{traceId}] %-5level %logger{36} - %msg%n"/>
  <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
    <encoder><pattern>${LOG_PATTERN}</pattern></encoder>
  </appender>
  <root level="INFO"><appender-ref ref="STDOUT"/></root>
</configuration>
```

# Developer checklist before PR

* [ ] Unit tests pass, coverage for changed modules.
* [ ] Flyway migration tested locally.
* [ ] No secrets in code.
* [ ] Logging includes correlation id.
* [ ] Documentation README updated.
* [ ] API contract updated (OpenAPI).
* [ ] Load / stress test for new heavy endpoint.

# Learning curve & priorities for a 2-year dev

1. Master: Spring Boot controllers, services, JPA, transactions, DTOs, validation.
2. Learn: Spring Security (JWT/OAuth), Flyway, Docker, Redis caching.
3. Get comfortable: Resilience4j, OpenTelemetry, Testcontainers, CI pipelines.
4. Advanced: Distributed tracing, autoscaling, cost-aware AI batching.

---

