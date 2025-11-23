# Error Handling & API Error Contract — Project-ready, Interview-ready

## Goals (one line)

Provide a single, predictable error payload, map exceptions → HTTP status consistently, log context, and keep handlers
minimal and testable.

---

## Packages / files

```
com.example.app
 ├─ dto/ErrorResponse.java
 ├─ exception/ApiException.java
 ├─ exception/ErrorCode.java
 ├─ exception/{NotFoundException,BadRequestException,ConflictException,UnauthorizedException,ForbiddenException}.java
 ├─ exception/GlobalExceptionHandler.java
```

---

## 1. Standard error payload

`dto/ErrorResponse.java`

```java
public record ErrorResponse(
    String traceId,
    String errorCode,
    String message,
    List<String> details,
    long timestamp
) {}
```

* `traceId`: MDC `traceId` for correlation.
* `errorCode`: machine-friendly code (see ErrorCode enum).
* `message`: human-friendly short message.
* `details`: optional field-level or extra info.
* `timestamp`: epoch millis.

---

## 2. Error codes (single source)

`exception/ErrorCode.java`

```java
public enum ErrorCode {
  VALIDATION_ERROR,
  RESOURCE_NOT_FOUND,
  CONFLICT,
  UNAUTHORIZED,
  FORBIDDEN,
  BAD_REQUEST,
  INTERNAL_ERROR,
  DATA_ACCESS_ERROR
}
```

* Use these values in `ErrorResponse.errorCode` and documentation (OpenAPI).

---

## 3. Base API exception

`exception/ApiException.java`

```java
public abstract class ApiException extends RuntimeException {
  private final ErrorCode code;
  public ApiException(ErrorCode code, String message) { super(message); this.code = code; }
  public ErrorCode getCode() { return code; }
}
```

Specific exceptions:

```java
public final class NotFoundException extends ApiException {
  public NotFoundException(String message) { super(ErrorCode.RESOURCE_NOT_FOUND, message); }
}
public final class BadRequestException extends ApiException {
  public BadRequestException(String message) { super(ErrorCode.BAD_REQUEST, message); }
}
public final class ConflictException extends ApiException {
  public ConflictException(String message) { super(ErrorCode.CONFLICT, message); }
}
// ... UnauthorizedException, ForbiddenException
```

* Throw these from services for clear semantics.

---

## 4. Global exception handler (single place)

`exception/GlobalExceptionHandler.java`

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  private ErrorResponse build(ErrorCode code, String message, List<String> details) {
    return new ErrorResponse(MDC.get("traceId"), code.name(), message, details == null ? List.of() : details, Instant.now().toEpochMilli());
  }

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ErrorResponse> onApi(ApiException ex) {
    var body = build(ex.getCode(), ex.getMessage(), null);
    var status = mapStatus(ex.getCode());
    log.warn("API error: {} - {}", ex.getCode(), ex.getMessage());
    return ResponseEntity.status(status).body(body);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> onValidation(MethodArgumentNotValidException ex) {
    var details = ex.getBindingResult().getFieldErrors()
                    .stream().map(f -> f.getField() + ": " + f.getDefaultMessage()).toList();
    var body = build(ErrorCode.VALIDATION_ERROR, "Validation failed", details);
    log.info("Validation failed: {}", details);
    return ResponseEntity.badRequest().body(body);
  }

  @ExceptionHandler({ HttpMessageNotReadableException.class, ConstraintViolationException.class })
  public ResponseEntity<ErrorResponse> onBadRequest(Exception ex) {
    var body = build(ErrorCode.BAD_REQUEST, ex.getMessage(), null);
    log.info("Bad request: {}", ex.getMessage());
    return ResponseEntity.badRequest().body(body);
  }

  @ExceptionHandler(DataAccessException.class)
  public ResponseEntity<ErrorResponse> onDataAccess(DataAccessException ex) {
    var body = build(ErrorCode.DATA_ACCESS_ERROR, "Data error", List.of(ex.getMostSpecificCause().getMessage()));
    log.error("Data access error", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> onGeneric(Exception ex) {
    var body = build(ErrorCode.INTERNAL_ERROR, "Internal server error", null);
    log.error("Unhandled exception", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
  }

  private HttpStatus mapStatus(ErrorCode code) {
    return switch(code) {
      case VALIDATION_ERROR, BAD_REQUEST -> HttpStatus.BAD_REQUEST;
      case RESOURCE_NOT_FOUND -> HttpStatus.NOT_FOUND;
      case CONFLICT -> HttpStatus.CONFLICT;
      case UNAUTHORIZED -> HttpStatus.UNAUTHORIZED;
      case FORBIDDEN -> HttpStatus.FORBIDDEN;
      case DATA_ACCESS_ERROR, INTERNAL_ERROR -> HttpStatus.INTERNAL_SERVER_ERROR;
    };
  }
}
```

* Centralizes mapping and logging.
* Keep messages non-sensitive.

---

## 5. How to throw exceptions (service layer)

```java
if (opt.isEmpty()) throw new NotFoundException("User not found for id " + id);
if (usernameExists) throw new ConflictException("Username already exists");
if (invalid) throw new BadRequestException("Invalid payload");
```

* Throw `ApiException` subtypes from services, not controllers.

---

## 6. Validation handling

* Use `@Valid` on controller DTOs.
* `MethodArgumentNotValidException` handled above returns field-level details.

---

## 7. Logging & tracing

* Include `traceId` via MDC (see logging doc).
* Log exceptions at appropriate level:

    * expected client errors → `INFO`/`WARN` (no stacktrace)
    * unexpected → `ERROR` with stacktrace.

---

## 8. Tests (unit + integration)

* Unit test `GlobalExceptionHandler` by invoking handlers directly.
* Integration test: send invalid requests and assert status + `ErrorResponse` structure and `errorCode`.
* Use `MockMvc` and assert JSON fields.

---

## 9. OpenAPI / docs

* Declare `ErrorResponse` as common response in OpenAPI (4xx/5xx).
* Document `errorCode` values and semantics.

---

## 10. Interview Qs & concise answers

Q: **Why a single error payload?**
A: Predictability for clients, easier parsing, consistent monitoring and docs.

Q: **When to use custom exceptions vs built-in?**
A: Use custom `ApiException` subtypes for domain-level decisions; let framework exceptions be handled centrally.

Q: **Should you include stack traces in responses?**
A: No — sensitive and noisy. Keep stack traces in server logs only.

Q: **How to provide field-level validation info?**
A: `MethodArgumentNotValidException` → list of `field: message` in `details`.

Q: **How to map exceptions to HTTP status?**
A: Use an enum → `mapStatus()` in handler; keep mapping centralized.

Q: **Where to log exceptions and at what level?**
A: Log at handler: expected client errors `INFO/WARN` (no stack), unexpected `ERROR` with stack.

---

## 11. Minimal checklist to implement now

1. Add `ErrorResponse`, `ErrorCode`, `ApiException` and subtypes.
2. Add `GlobalExceptionHandler` with mappings above.
3. Use MDC `traceId`.
4. Document `ErrorResponse` in OpenAPI.
5. Add integration tests asserting shape + codes.

---


