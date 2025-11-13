# API Design & Versioning — Industry-Standard Guide (Concise but Detailed)

**1. Use Versioned URLs**

* Mandatory version prefix:
  `/api/v1/users`
* Increment only for breaking changes (v2, v3).
* Do not mix versions in the same module.

**2. Follow Consistent Resource Naming**

* Use nouns, pluralized for collections:
  `/users`, `/orders/{id}`
* No verbs in paths (`/createUser` is wrong).
* Hierarchical relations:
  `/users/{id}/orders`.

**3. Use Standard HTTP Methods Correctly**

* `GET` → fetch
* `POST` → create
* `PUT` → full update
* `PATCH` → partial update
* `DELETE` → remove
  Avoid misusing methods.

**4. Make Request/Response Structures Predictable**

* Always return DTOs; never expose JPA entities.
* Response wrapper (optional but common):

  ```json
  {
    "data": { ... },
    "meta": { ... }
  }
  ```

**5. Standardize Error Contract**

* Use a single global error format:

  ```json
  {
    "errorCode": "RESOURCE_NOT_FOUND",
    "message": "User not found",
    "details": []
  }
  ```
* Return proper HTTP status codes (400, 401, 403, 404, 409, 500).
* Validation errors should list field-level issues.

**6. API Pagination Convention**

* Standard params: `page`, `size`, optional `sort`.
* Response structure:

  ```json
  {
    "items": [ ... ],
    "page": 1,
    "size": 20,
    "total": 120
  }
  ```

**7. Consistent Query Parameter Design**

* Use predictable param names: `status`, `fromDate`, `toDate`, `type`.
* Avoid complex nested params; keep flat.

**8. JSON Only for REST**

* Content-Type: `application/json`.
* No mixing XML unless required.

**9. Idempotency for POST (When Needed)**

* Idempotency-Key header for operations that must not duplicate:
  `Idempotency-Key: <uuid>`.

**10. Avoid Non-Standard HTTP Status Codes**

* Stick to standard codes.
* Do not create custom status numbers.

**11. Use OpenAPI (Swagger) as Source of Truth**

* Maintain `/v3/api-docs` and Swagger UI.
* Document: request/response models, examples, error formats.
* Every controller endpoint must have clear annotations.

**12. Keep Controller Layer Thin**

* No business logic.
* Map DTOs, call service, return response.

**13. Handle Versioning Correctly**

* Add new fields in responses without bumping version.
* Remove or rename fields only in new major version.
* Old versions should be decommissioned via lifecycle policy.

**14. Ensure Backward Compatibility**

* Returning extra fields must not break clients.
* Never change the meaning of an existing field.

**15. Use Proper HTTP Caching Headers**

* For GET endpoints with stable data:
  `ETag`, `Cache-Control`, `Last-Modified`.

**16. Avoid Overfetching & Underfetching**

* Allow filtering:
  `/users?active=true`
* Consider pagination or projections for large payloads.

**17. Keep Endpoint Count Clean & Minimal**

* No duplicates doing similar work.
* Combine where logically correct (e.g., `/users/search` optional).


