# Exception Handling Quick Reference

## 🎯 When to Throw What

| Scenario                 | Exception                  | HTTP Status |
|--------------------------|----------------------------|-------------|
| Resource not found       | `NotFoundException`        | 404         |
| Duplicate resource       | `ConflictException`        | 409         |
| Invalid input            | `BadRequestException`      | 400         |
| Auth required/failed     | `UnauthorizedException`    | 401         |
| Insufficient permissions | `ForbiddenException`       | 403         |
| Bean validation fails    | Use `@Valid` in controller | 400         |

## 💡 Common Patterns

### Pattern 1: Optional.orElseThrow

```java
return repository.findById(id)
    .orElseThrow(() -> new NotFoundException("User not found: " + id));
```

### Pattern 2: Check then throw

```java
if (repository.existsByUsername(username)) {
    throw new ConflictException("Username already exists: " + username);
}
```

### Pattern 3: Validation

```java
if (age < 0 || age > 150) {
    throw new BadRequestException("Invalid age: " + age);
}
```

### Pattern 4: Controller validation

```java
@PostMapping
public Response create(@Valid @RequestBody Request req) {
    // @Valid automatically throws MethodArgumentNotValidException
    // GlobalExceptionHandler converts it to ErrorResponse with field details
}
```

## 📋 DTO Validation Annotations

```java
public record UserRequest(
    @NotBlank(message = "Username required")
    @Size(min = 3, max = 50)
    String username,
    
    @NotNull(message = "Email required")
    @Email(message = "Invalid email")
    String email,
    
    @Min(value = 18, message = "Must be 18+")
    @Max(value = 120)
    Integer age,
    
    @Pattern(regexp = "^\\+?[0-9]{10,15}$")
    String phone
) {}
```

## 🧪 Test Endpoints (Demo)

```bash
# 404 - NotFoundException
GET /api/demo/not-found

# 409 - ConflictException
POST /api/demo/conflict

# 400 - BadRequestException
GET /api/demo/bad-request

# 400 - Validation Error
POST /api/demo/validation
Body: {"name":"","email":""}

# 500 - Internal Error
GET /api/demo/internal-error
```

## 📦 Response Format

```json
{
  "traceId": "abc-123",        // From MDC, for log correlation
  "errorCode": "RESOURCE_NOT_FOUND",  // ErrorCode enum value
  "message": "User not found: 42",    // Human-readable
  "details": [],                       // Field errors (if validation)
  "timestamp": 1699876543210          // Epoch milliseconds
}
```

## 🚫 Don'ts

❌ Don't throw generic RuntimeException

```java
throw new RuntimeException("Error"); // BAD
```

❌ Don't return null or error objects

```java
return null; // BAD
return new ErrorDTO(); // BAD
```

❌ Don't handle in controller (let GlobalExceptionHandler do it)

```java
try {
    service.method();
} catch (Exception e) {
    return ResponseEntity.badRequest()... // BAD
}
```

❌ Don't include sensitive data in messages

```java
throw new NotFoundException("User not found. Password was: " + pwd); // BAD!
```

## ✅ Do's

✅ Throw specific exceptions from services

```java
throw new NotFoundException("User not found: " + id); // GOOD
```

✅ Use @Valid for bean validation

```java
public Response create(@Valid @RequestBody Request req) // GOOD
```

✅ Include context in messages

```java
throw new ConflictException("Username already exists: " + username); // GOOD
```

✅ Let GlobalExceptionHandler convert to HTTP response

```java
// Service just throws, handler converts to ResponseEntity
```

## 🔍 Debugging Tips

1. **Find the request in logs**: Use `traceId` from error response
2. **Check log level**: Client errors (4xx) are INFO/WARN, server errors (5xx) are ERROR
3. **Stack traces**: Only in server logs, never in response body
4. **Field validation**: Check `details` array for field-level errors

## 📚 Full Docs

- `README-EXCEPTION-HANDLING.md` - Complete guide
- `EXCEPTION-IMPLEMENTATION-SUMMARY.md` - Implementation details
- `notes/4-exception.md` - Design specification

---

**Remember**: Throw exceptions in services, not controllers. GlobalExceptionHandler takes care of the rest!

