# Logging — SLF4J + Logback Practical Guide (concise, interview-ready)

## Goals

1. Reliable, readable logs for debugging and monitoring.
2. Minimal overhead and safe for production (no secrets).
3. Standardized usage across codebase so you can explain and demonstrate in interviews.

---

## 1 — Dependencies (Maven)

```xml
<!-- SLF4J API -->
<dependency>
  <groupId>org.slf4j</groupId>
  <artifactId>slf4j-api</artifactId>
  <version>1.7.36</version>
</dependency>

<!-- Logback implementation (default in Spring Boot; explicit if needed) -->
<dependency>
  <groupId>ch.qos.logback</groupId>
  <artifactId>logback-classic</artifactId>
  <version>1.2.11</version>
</dependency>

<!-- Optional: JSON encoder for structured logs -->
<dependency>
  <groupId>net.logstash.logback</groupId>
  <artifactId>logstash-logback-encoder</artifactId>
  <version>7.4</version>
</dependency>
```

---

## 2 — Basic configuration (application.yml + logback)

**application.yml** (spring-level control)

```yaml
logging:
  level:
    root: INFO
    com.example.app: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd'T'HH:mm:ss.SSS} %-5level [%X{traceId:-}] %logger{36} - %msg%n"
```

**logback-spring.xml** (recommended file; supports Spring profile activation)

```xml
<configuration scan="true" debug="false">
  <springProperty scope="context" name="LOG_PATH" source="logging.file.path" defaultValue="logs"/>

  <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <encoder>
      <pattern>%d{yyyy-MM-dd'T'HH:mm:ss.SSS} %-5level [%X{traceId:-}] %logger{36} - %msg%n</pattern>
    </encoder>
  </appender>

  <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>${LOG_PATH}/app.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
      <fileNamePattern>${LOG_PATH}/app.%d{yyyy-MM-dd}.log.gz</fileNamePattern>
      <maxHistory>30</maxHistory>
      <totalSizeCap>1GB</totalSizeCap>
    </rollingPolicy>
    <encoder>
      <pattern>%d{ISO8601} %-5level [%X{traceId:-}] %logger{36} - %msg%n</pattern>
    </encoder>
  </appender>

  <root level="INFO">
    <appender-ref ref="CONSOLE" />
    <appender-ref ref="FILE" />
  </root>
</configuration>
```

**Meaning of key elements**

* `ConsoleAppender` / `RollingFileAppender`: where logs go.
* `encoder.pattern`: log message template. `%d` timestamp, `%level` severity, `%X{traceId}` MDC value, `%logger` class,
  `%msg` message.
* `TimeBasedRollingPolicy`: rotate logs daily, compress old logs. `maxHistory` retention.
* `logging.level`: set per-package level; root level default.

---

## 3 — Logging usage in code (SLF4J)

**Recommended (no concat, parameterized)**

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UserService {
  private static final Logger log = LoggerFactory.getLogger(UserService.class);

  public void createUser(UserDto dto) {
    log.debug("createUser request: {}", dto.getUsername());
    try {
      // business logic
      log.info("User created: id={}, username={}", id, dto.getUsername());
    } catch (Exception e) {
      log.error("Failed to create user: {}", dto.getUsername(), e); // exception last
      throw e;
    }
  }
}
```

**With Lombok**

```java
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class UserService { ... }
```

**Why parameterized logging?**

* Avoids unnecessary `toString()` work when level is disabled.
* Keeps message template consistent.

---

## 4 — MDC (Mapped Diagnostic Context) — correlate requests

**Set traceId per request (filter)**

```java
public class LoggingFilter extends OncePerRequestFilter {
  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String traceId = Optional.ofNullable(req.getHeader("X-Request-Id")).orElse(UUID.randomUUID().toString());
    MDC.put("traceId", traceId);
    try { chain.doFilter(req, res); } finally { MDC.clear(); }
  }
}
```

* Add `%X{traceId}` to pattern.
* Use same trace across upstream/downstream services.

---

## 5 — Structured logging (JSON) — when to use

* Use `logstash-logback-encoder` to emit JSON for ingestion by ELK/Datadog.
* Example encoder in `logback-spring.xml`:

```xml
<encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
```

* Structured fields: `timestamp`, `level`, `logger`, `message`, `traceId`, custom fields.

---

## 6 — Log levels — meaning & guidelines

* `TRACE` — fine-grained dev-level (rare).
* `DEBUG` — development troubleshooting, verbose.
* `INFO` — high-level lifecycle events (app start/stop, major actions). Safe in production.
* `WARN` — recoverable abnormal situations.
* `ERROR` — failures requiring attention; always log with exception.
* `FATAL` — not used in SLF4J/Logback; map to `ERROR`.

**Rule**: prefer `INFO` for business events, `DEBUG` for flow details, `ERROR` for exceptions.

---

## 7 — Exception logging best practices

* Log at the point you can add context, not both here and upstream (avoid duplicate stack traces).
* Always pass the exception as the last parameter: `log.error("msg {}", var, e)`.
* For expected exceptions (validation), use `WARN` or `INFO` with clear code; avoid stack trace for simple client
  errors.

---

## 8 — Sensitive data & privacy

* Never log passwords, tokens, PII (SSN, credit card).
* Mask or redact fields before logging. Example: `mask(password)` or DTOs that omit secrets.
* Audit logs for security events should be separate, controlled, and access-limited.

---

## 9 — Performance & reliability

* Use parameterized logging to avoid cost when level disabled.
* Use asynchronous appenders for high-throughput (Logback `AsyncAppender`) to avoid blocking threads.
* Keep log message creation cheap; avoid heavy serialization in log statements.
* Rotate logs and set `totalSizeCap` to avoid disk fill.

---

## 10 — Correlation across services

* Propagate `traceId` (HTTP header `X-Request-Id` or `traceparent` for W3C).
* Add `spanId`/trace from distributed tracing system (Jaeger/Zipkin) to logs via MDC.

---

## 11 — Queryable fields to include

* `traceId`, `userId` (if available), `requestId`, `endpoint`, `status`, `durationMs`, `errorCode`.
* Keep consistent field names for logging/ELK dashboards.

---

## 12 — Log format examples

**Human-readable**

```
2025-11-13T12:34:56.789 INFO [abcd-1234] com.example.service.UserService - User created: id=42 username=jdoe
```

**JSON (structured)**

```json
{
  "timestamp":"2025-11-13T12:34:56.789Z",
  "level":"INFO",
  "logger":"com.example.service.UserService",
  "message":"User created",
  "traceId":"abcd-1234",
  "userId":"42",
  "durationMs":15
}
```

---

## 13 — Testing logs

* Unit test: assert that code calls logger? Rare — prefer behavior tests.
* Integration test: check important events appear using test appender (Logback `ListAppender`) when validating flows.

---

## 14 — Common interview Qs & concise answers

Q: **Why use SLF4J instead of System.out?**
A: SLF4J is an abstraction with performant parameterized API, supports pluggable backends (Logback), and integrates with
frameworks and appenders.

Q: **Why parameterized logging (`{}`) over string concat?**
A: Avoids expensive `toString()` when level disabled; better performance and readability.

Q: **What is MDC and why use it?**
A: Thread-local map to attach contextual data (traceId, userId) to all log lines from the same request; helps
correlation.

Q: **What log levels to use for business events?**
A: `INFO` for major business events, `DEBUG` for developer troubleshooting, `WARN` for recoverable anomalies, `ERROR`
for failures.

Q: **How to avoid logging sensitive data?**
A: Design DTOs to exclude secrets, sanitize inputs, enforce code reviews and static checks, redact before logging.

Q: **When to use JSON logs?**
A: When logs are ingested into centralized systems (ELK, Splunk) for search/analytics/alerts.

Q: **How do you correlate logs across services?**
A: Propagate a trace/request id in headers and add to MDC; use distributed tracing (OpenTelemetry/Zipkin/Jaeger).

Q: **How to handle large volume logging?**
A: Use async appenders, sampling, higher log levels in prod, and avoid verbose DEBUG statements in hot paths.

Q: **What’s a good log retention policy?**
A: Depends on compliance; typical is 7–90 days. Rotate daily and cap total size.

---

## 15 — Quick checklist to apply now

1. Add SLF4J + Logback dependencies.
2. Create `logback-spring.xml` with console + rolling file appenders.
3. Add MDC filter for `traceId`.
4. Standardize pattern and include `traceId` and `userId`.
5. Enforce parameterized logging and no sensitive fields.
6. Enable JSON encoder when using centralized logging.
7. Add async appender if throughput high.
8. Add retention policy and rotation.
9. Document logging conventions in repo README.
10. Code review checklist: logging level, no secrets, MDC continuity.

---

## 16 — Minimal code snippets to show in interview

**MDC filter**

```java
public class RequestIdFilter extends OncePerRequestFilter {
  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String id = Optional.ofNullable(req.getHeader("X-Request-Id")).orElse(UUID.randomUUID().toString());
    MDC.put("traceId", id);
    try { chain.doFilter(req, res); } finally { MDC.clear(); }
  }
}
```

**Controller log example**

```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {
  private static final Logger log = LoggerFactory.getLogger(UserController.class);

  @PostMapping
  public ResponseEntity<UserResponse> create(@RequestBody CreateUserDto dto) {
    log.info("createUser requested email={}", dto.getEmail());
    // ...
  }
}
```

---

