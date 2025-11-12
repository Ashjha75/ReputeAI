Below: a compact, production-ready reference for **RBAC in Spring** + **API versioning** tailored to your project. No fluff. Use it as a checklist and implementation map.

# 1 — One-line summary

Use JWT (short-lived access + refresh) for auth, RBAC for coarse control (roles), permissions/ABAC for fine-grained checks, enforce at service layer with method security, and version APIs by path (`/api/v1`) with a deprecation policy.

# 2 — Roles vs Permissions (model)

* **Role** = coarse grouping humans/clients use. e.g. `USER`, `ADMIN`, `AUDITOR`, `SYSTEM`.
* **Permission** = fine-grained capability (string): `post:read`, `post:create`, `post:delete`, `analysis:run`, `account:manage`.
* Store in DB:

  * `roles` table
  * `permissions` table
  * `role_permissions(role_id, permission_id)`
  * `user_roles(user_id, role_id)`
* Cache role→permission mapping in Redis with short TTL (60s). Invalidate on changes.

# 3 — JWT contents (what to include)

* `sub` = user id
* `roles` = array of role names (optional)
* `scp` or `perms` = array of permission strings (if you want token-contained perms)
* `jti`, `exp`, `iat`, `kid`
  Prefer short-lived tokens and validate permissions server-side (don’t trust everything in token for high-sensitivity checks).

# 4 — Enforcement layers (in order of preference)

1. **Authentication Filter** — validate JWT, populate `SecurityContext` with `Authentication` and authorities.
2. **Gatekeeping at Controller** — for coarse role checks using `@PreAuthorize("hasRole('ADMIN')")`.
3. **Service-layer authorization** — mandatory. Use method-level annotations or explicit checks. Keep logic here.
4. **Resource-level checks / ABAC** — evaluate owner, tenant, resource sensitivity. Use a `PermissionEvaluator` or custom policy engine.
5. **Audit** — every GRANT/DENY logged to `audit` logger with `traceId`.

# 5 — Spring wiring (short blueprint)

* Use Spring Security 6 with `SecurityFilterChain` bean.
* Register a `JwtAuthenticationFilter` earlier in filter chain.
* Enable method security: `@EnableMethodSecurity(prePostEnabled=true)`.

Minimal expression examples:

```java
@PreAuthorize("hasRole('ADMIN')")
public void adminOnly() { ... }

@PreAuthorize("hasAuthority('post:delete') or @permEvaluator.isOwner(#postId, authentication)")
public void deletePost(Long postId) { ... }
```

# 6 — PermissionEvaluator idea (concise)

* Implement `PermissionEvaluator` that loads permission rules from DB/cache and evaluates dynamic checks like ownership, tenant, sensitivity.
* Keep it fast: short-circuit if `hasAuthority('post:delete')` present. Otherwise consult DB/cache.

# 7 — Authorization granularity (practical rules)

* **Coarse (role)** for admin surface and feature toggles.
* **Fine (permission)** for business actions (create/edit/delete). Use `permission strings`.
* **Resource (ABAC)** when decision depends on resource attributes (ownerId, createdAt, sensitivity). Prefer service-layer check `authorize(user, action, resource)` rather than complex SpEL everywhere.
* **Client credentials / SYSTEM** role with limited scope for internal jobs. Use key rotation.

# 8 — Fail / error behavior

* Unauthorized (no/invalid token) -> `401`. Use `WWW-Authenticate` header where applicable.
* Forbidden (authenticated but lacks permission) -> `403` with error code `1403`. Log `traceId` and decision context.
* Never leak why permission denied beyond `message: "forbidden"`. Put diagnostic in server logs only.

# 9 — Admin & emergency controls

* Admin endpoint to change role-permission map. Invalidate permission cache on change.
* Emergency kill-switch: feature flag or config to disable destructive operations. Log audit event when used.

# 10 — Testing & CI checks

* Unit test `PermissionEvaluator` and service-layer checks.
* Integration tests: assert `401`/`403` for missing/insufficient perms.
* Contract test that token format and claims are accepted by security filter.

# 11 — API Versioning (concise patterns & rules)

* **Primary strategy:** URL path versioning. Use `/api/v1/...` (simple, explicit, widely adopted).
* **Auxiliary:** Add `Accept` header media-type versioning only for strict content negotiation if needed later. Avoid combining multiple active strategies.
* **Version in OpenAPI** and docs.

Version lifecycle:

* `v1` = stable. Changes must be backward compatible.
* For breaking changes create `v2`. Maintain `v1` for N months (policy: e.g., 6 months), then deprecate with clear timeline in API spec and release notes.
* **Deprecation headers:** Responses on soon-to-be-removed endpoints include `Deprecation: true` and `Sunset: <date>`.
* **No per-endpoint micro-versioning**. Keep version coarse-grained per contract.

# 12 — How auth ties to versioning (keep separate)

* **Do not** mix auth model changes and breaking API changes in same minor release. If you must, bump API version.
* auth rules are independent of URL versioning. Same RBAC model can serve multiple API versions. Authorization checks live in service layer and are applied regardless of `v1` or `v2`.

# 13 — Practical deployment & rollout tips

* Deploy new version behind feature flag. Route traffic using API Gateway stage `/v2` when ready.
* Use backward-compatible JWT parsing (accept older `scp`/`perms` claim names).
* Maintain migration plan for permission data when introducing new permissions (DB migration script adds new permission rows; admin UI to assign).

# 14 — Minimal example mapping (cheat sheet)

* Role: `ADMIN`
* Permission: `post:delete`
* Controller: `@PreAuthorize("hasAuthority('post:delete')")`
* Service: `authorize(currentUser, DELETE, post)` -> check ownership/permission -> log decision.

# 15 — Checklist to implement now

* [ ] JWT: add `perms` claim or resolve perms from DB on auth.
* [ ] `SecurityFilterChain` + `JwtAuthenticationFilter`.
* [ ] `@EnableMethodSecurity(prePostEnabled=true)`.
* [ ] `PermissionEvaluator` + cache for role->perm mapping.
* [ ] Service-layer `authorize(...)` helper for ABAC checks.
* [ ] Controller-level `@PreAuthorize` for coarse gates.
* [ ] API path versioning `/api/v1/...` + deprecation headers plan.
* [ ] Audit logging on grant/deny + cache invalidation on role changes.
* [ ] Tests for auth/permission flows and versioned behavior.
