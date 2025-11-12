Use SLF4J. Keep logs structured via JSON (Logstash encoder). Add a small request filter to set MDC correlation ids. Log contextual fields via MDC, not string concat. Minimal, copy-pasteable.

# 1 — Dependencies (pom.xml)

```xml
<!-- required for JSON encoder -->
<dependency>
  <groupId>net.logstash.logback</groupId>
  <artifactId>logstash-logback-encoder</artifactId>
  <version>7.4</version>
</dependency>
```

# 2 — Minimal logback-spring.xml (production-ready, JSON)

Save as `src/main/resources/logback-spring.xml`.

```xml
<configuration>
  <springProperty name="SERVICE" source="spring.application.name" defaultValue="app"/>
  <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
      <customFields>{"service":"${SERVICE}","env":"${spring.profiles.active:-local}"}</customFields>
    </encoder>
  </appender>

  <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>/var/log/${SERVICE}/app.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
      <fileNamePattern>/var/log/${SERVICE}/app.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
      <timeBasedFileNamingAndTriggeringPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP">
        <maxFileSize>100MB</maxFileSize>
      </timeBasedFileNamingAndTriggeringPolicy>
      <maxHistory>14</maxHistory>
      <totalSizeCap>2GB</totalSizeCap>
    </rollingPolicy>
    <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
  </appender>

  <appender name="ASYNC" class="ch.qos.logback.classic.AsyncAppender">
    <appender-ref ref="STDOUT"/>
    <appender-ref ref="FILE"/>
    <queueSize>512</queueSize>
  </appender>

  <!-- audit logger writes to separate file if needed -->
  <appender name="AUDIT_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>/var/log/${SERVICE}/audit.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
      <fileNamePattern>/var/log/${SERVICE}/audit.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
      <maxHistory>365</maxHistory>
    </rollingPolicy>
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
      <customFields>{"type":"audit"}</customFields>
    </encoder>
  </appender>

  <logger name="audit" level="INFO" additivity="false">
    <appender-ref ref="AUDIT_FILE"/>
  </logger>

  <root level="INFO">
    <appender-ref ref="ASYNC"/>
  </root>
</configuration>
```

# 3 — Correlation filter (MDC)

Put this before any other filter so MDC is present for security/other logs.

```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestCorrelationFilter extends OncePerRequestFilter {
  private static final String TRACE_ID = "traceId";
  private static final String REQUEST_ID = "requestId";
  private static final String USER_ID = "userId";

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    try {
      String trace = firstNonEmpty(req.getHeader("X-Trace-Id"), req.getHeader("X-B3-TraceId"), UUID.randomUUID().toString());
      String reqId = firstNonEmpty(req.getHeader("X-Request-Id"), UUID.randomUUID().toString());
      MDC.put(TRACE_ID, trace);
      MDC.put(REQUEST_ID, reqId);

      // optional: populate userId when security context exists
      Authentication auth = SecurityContextHolder.getContext().getAuthentication();
      if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserDetails) {
        String uid = ((UserDetails) auth.getPrincipal()).getUsername();
        MDC.put(USER_ID, uid);
      }

      res.setHeader("X-Trace-Id", trace);
      res.setHeader("X-Request-Id", reqId);
      chain.doFilter(req, res);
    } finally {
      MDC.clear();
    }
  }

  private String firstNonEmpty(String... vals) {
    for (String v : vals) if (v != null && !v.isBlank()) return v;
    return null;
  }
}
```

# 4 — How to log (SLF4J patterns)

Use parameterized logging and rely on MDC for structured fields.

```java
private static final Logger log = LoggerFactory.getLogger(MyService.class);

public void handle(Order o) {
  log.info("order.process.started - orderId={}", o.getId());   // message + structured field in message
  // better: put transient fields in MDC for automatic JSON fields
  MDC.put("orderId", String.valueOf(o.getId()));
  try {
    // work
    log.info("order.process.completed");
  } catch (Exception e) {
    log.error("order.process.failed", e);
    throw e;
  } finally {
    MDC.remove("orderId");
  }
}
```

Prefer putting commonly queried keys in MDC (`traceId`, `requestId`, `userId`, `accountId`, `orderId`). Logstash encoder will merge MDC into JSON output.

# 5 — Audit logging (append-only)

Use a dedicated logger name `audit`. Do not mix with regular logs.

```java
private static final Logger audit = LoggerFactory.getLogger("audit");

public void deletePost(Long postId, Long userId) {
  audit.info("action=DELETE_POST userId={} postId={} outcome=REQUESTED", userId, postId);
}
```

# 6 — PII handling

* Never log raw PII. Mask before logging.
* Small mask util:

```java
public final class Mask {
  public static String email(String e){
    if (e==null) return null;
    String[] p = e.split("@");
    return p[0].charAt(0) + "***@" + p[1];
  }
}
```

# 7 — Runtime controls + actuator

Enable `/actuator/loggers` (secure it) so ops can change log levels without a restart.

`application.yml`:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,loggers
  endpoint:
    loggers:
      enabled: true
```

# 8 — Practical checklist (minimal)

1. Add dependency.
2. Add `logback-spring.xml` above.
3. Register `RequestCorrelationFilter`. Order high.
4. Use SLF4J parameterized logging. Put keys in MDC, not in messages.
5. Configure `audit` logger separately.
6. Mask PII. Write unit tests for masking.
7. Enable actuator loggers and secure it.
8. Send logs to aggregator (CloudWatch/ELK) as JSON and correlate using `traceId`.

# 9 — Short advice (keep it simple)

* MDC + JSON = structured, searchable logs.
* Use small set of keys: `traceId`, `requestId`, `userId`, `accountId`. Keep them consistent.
* Audit events go to `audit` logger.
* Avoid heavy synchronous appenders. Use async.
* Don’t log secrets.

