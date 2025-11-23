# Exception Handling & Error Contract

## Overview

Centralized error handling system providing predictable, standardized error responses for all API errors.

## Architecture

### Error Response Structure

All errors return this JSON structure:

```json
{
  "traceId": "abc123-...",
  "errorCode": "RESOURCE_NOT_FOUND",
  "message": "User not found for id 42",
  "details": [],
  "timestamp": 1699876543210
}
```

### Components

#### 1. ErrorResponse (DTO)

- Standard error payload returned for all exceptions
- Includes traceId for correlation with logs
- Machine-readable errorCode + human-readable message

#### 2. ErrorCode (Enum)

Single source of truth for error codes:

- `VALIDATION_ERROR` - Bean validation failures
- `RESOURCE_NOT_FOUND` - 404 scenarios
- `CONFLICT` - Duplicate resources, constraint violations
- `UNAUTHORIZED` - Authentication required/failed
- `FORBIDDEN` - Insufficient permissions
- `BAD_REQUEST` - Malformed requests
- `INTERNAL_ERROR` - Unexpected server errors
- `DATA_ACCESS_ERROR` - Database errors

#### 3. ApiException (Base Class)

Abstract base for all custom exceptions. Contains ErrorCode.

#### 4. Specific Exceptions

- `NotFoundException` → 404
- `BadRequestException` → 400
- `ConflictException` → 409
- `UnauthorizedException` → 401
- `ForbiddenException` → 403

#### 5. GlobalExceptionHandler

`@RestControllerAdvice` that:

- Catches all exceptions
- Maps to appropriate HTTP status
- Logs with correct level (INFO/WARN/ERROR)
- Returns standardized ErrorResponse
- Includes traceId from MDC

## Usage in Services

### Throwing Exceptions

```java
// Service layer
public User findById(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("User not found for id " + id));
}

public void createUser(CreateUserRequest req) {
    if (userRepository.existsByUsername(req.username())) {
        throw new ConflictException("Username already exists: " + req.username());
    }
    // ... create user
}

public void validateInput(String input) {
    if (input == null || input.isBlank()) {
        throw new BadRequestException("Input cannot be empty");
    }
}
```

### Validation in Controllers

```java
@PostMapping("/users")
public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
    // @Valid triggers MethodArgumentNotValidException on validation failure
    // GlobalExceptionHandler catches it and returns field-level errors
    return ResponseEntity.ok(userService.create(request));
}
```

## HTTP Status Mapping

| ErrorCode          | HTTP Status | Use Case                                 |
|--------------------|-------------|------------------------------------------|
| VALIDATION_ERROR   | 400         | Bean validation failures (@Valid)        |
| BAD_REQUEST        | 400         | Malformed JSON, invalid input            |
| UNAUTHORIZED       | 401         | Missing/invalid authentication           |
| FORBIDDEN          | 403         | Insufficient permissions                 |
| RESOURCE_NOT_FOUND | 404         | Entity not found                         |
| CONFLICT           | 409         | Duplicate resource, constraint violation |
| DATA_ACCESS_ERROR  | 500         | Database errors                          |
| INTERNAL_ERROR     | 500         | Unexpected exceptions                    |

## Logging Strategy

- **Expected client errors** (4xx): `INFO` or `WARN`, no stack trace
- **Server errors** (5xx): `ERROR` with full stack trace
- Always include traceId in logs (from MDC)
- Never log sensitive data (passwords, tokens, PII)

## Testing

### Unit Test Example

```java
@Test
void testNotFoundExceptionHandling() {
    NotFoundException ex = new NotFoundException("User not found");
    ResponseEntity<ErrorResponse> response = handler.handleApiException(ex);
    
    assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    assertEquals("RESOURCE_NOT_FOUND", response.getBody().errorCode());
    assertNotNull(response.getBody().traceId());
}
```

### Integration Test Example

```java
@Test
void testCreateUser_Conflict() throws Exception {
    mockMvc.perform(post("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"existing\"}"))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.errorCode").value("CONFLICT"))
        .andExpect(jsonPath("$.traceId").exists())
        .andExpect(jsonPath("$.message").value("Username already exists"));
}
```

## Best Practices

1. **Throw exceptions from service layer, not controllers**
    - Controllers handle HTTP concerns
    - Services handle business logic and validation

2. **Use specific exception types**
    - Clear intent: `NotFoundException` vs generic `RuntimeException`
    - Consistent mapping to HTTP status

3. **Keep error messages non-sensitive**
    - No stack traces in response body
    - No internal implementation details
    - No PII or credentials

4. **Include context in messages**
    - Good: `"User not found for id 42"`
    - Bad: `"Not found"`

5. **Use validation annotations**
    - `@Valid`, `@NotNull`, `@Size`, etc.
    - Let GlobalExceptionHandler format field errors

6. **Test error scenarios**
    - Unit test exception handlers
    - Integration test actual endpoints returning errors

## OpenAPI/Swagger Documentation

Document ErrorResponse schema in your OpenAPI config:

```java
@Bean
public OpenAPI customOpenAPI() {
    return new OpenAPI()
        .components(new Components()
            .addSchemas("ErrorResponse", new Schema<>()
                .type("object")
                .addProperty("traceId", new StringSchema())
                .addProperty("errorCode", new StringSchema())
                .addProperty("message", new StringSchema())
                .addProperty("details", new ArraySchema().items(new StringSchema()))
                .addProperty("timestamp", new Schema<>().type("integer").format("int64"))
            )
        );
}
```

## Interview Talking Points

**Q: Why centralized exception handling?**
A: Single source of truth for error responses. Consistent structure for clients, easier testing, monitoring, and
documentation.

**Q: When to use custom exceptions vs built-in?**
A: Use custom `ApiException` subtypes for domain/business errors. Framework exceptions (validation, malformed JSON) are
handled centrally.

**Q: How to avoid leaking sensitive data in errors?**
A: Never include stack traces, internal paths, or implementation details in response. Log sensitive context server-side
only.

**Q: Why include traceId?**
A: Correlates client error with server logs. Client reports traceId, support can quickly find exact request in logs.

**Q: How to handle field-level validation errors?**
A: Use `@Valid` on DTOs. `MethodArgumentNotValidException` handler returns `details` array with `field: message`
entries.

---

For implementation details, see:

- `notes/4-exception.md` - Complete design documentation
- `exception/GlobalExceptionHandler.java` - Central error handling logic

