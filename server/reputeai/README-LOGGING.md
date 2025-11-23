# Logging Conventions and Checklist

## Dependencies

- SLF4J API, Logback Classic, logstash-logback-encoder (see pom.xml)

## Configuration

- `logback-spring.xml` for appenders, patterns, async, JSON, retention
- `application.yml` for log levels and console pattern

## Usage

- Use parameterized logging (`log.info("User {}", userId)`), never string concat
- Use `@Slf4j` (Lombok) or `LoggerFactory` in all classes
- Never log sensitive data (passwords, tokens, PII)
- Use MDC (`traceId`) for request correlation (see `RequestIdFilter`)
- Log exceptions with context, exception last: `log.error("msg {}", var, e)`
- Use `INFO` for business events, `DEBUG` for dev, `ERROR` for failures

## Checklist

- [x] SLF4J + Logback dependencies
- [x] logback-spring.xml with console, file, async, JSON (optional)
- [x] MDC filter for traceId
- [x] Parameterized logging everywhere
- [x] No sensitive data in logs
- [x] Log rotation and retention
- [x] Documented conventions

## Example

```
2025-11-13T12:34:56.789 INFO [abcd-1234] com.reputeai.service.UserService - User created: id=42 username=jdoe
```

## For centralized logging (ELK, Datadog)

- Uncomment JSON appender in logback-spring.xml
- Use log shipping agent (Filebeat, Fluentd, etc.)

---
For details, see `notes/3-logging.md`.

