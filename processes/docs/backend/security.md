
# Security Playbook — ReputeAI (concise, actionable)

---

## 1. Principles (one-line each)

* **Fail-safe defaults**: deny by default; allow by role.
* **Least privilege**: services and users get minimal rights.
* **Defense in depth**: app, network, infra layers.
* **Immutable secrets**: no hardcoded secrets; rotate.
* **Auditability**: every sensitive action logged with traceId and actor.

---

## 2. Authentication & Authorization

### Architecture

* **User sessions**: JWT access token (short lived, e.g. 5–15m) + opaque refresh token (longer, e.g. 7–30d).
* **Platform connectors**: OAuth2 for third-party platforms (store provider tokens encrypted / in Secrets Manager or encrypted DB).
* **Auth responsibilities**:

  * `AuthService` issues JWTs signed with RSA-256 (private key in Secrets Manager).
  * `RefreshService` validates and rotates refresh tokens and supports revocation (store refresh token hash in DB).
  * `SecurityConfig` validates tokens per request and populates `SecurityContext`.

### Authorization model

* **RBAC** for app features: roles = `USER`, `ADMIN`, `AUDITOR`, `SYSTEM`.
* Use Spring Security method-level checks: `@PreAuthorize("hasRole('ADMIN')")`.
* **ABAC** optional for sensitive actions: evaluate (actor.role, resource.ownerId, time, post.sensitivity) in service layer.
* Store roles and permissions in DB; cache in Redis with short TTL and refresh on changes.

### Implementation notes

* Use `spring-security-oauth2-client` for connectors.
* Sign JWTs with RSA keypair; rotate keys quarterly and expose public keys via JWKS endpoint for services.
* Persist refresh token hashes only (`SHA-256`), not raw tokens.
* Include `jti` claim and maintain token revocation list (Redis with TTL same as token expiry).
* Provide an admin endpoint to revoke tokens and to revoke connectors.

---

## 3. OAuth2 / Platform token lifecycle

* Use Authorization Code flow with PKCE for browser flows.
* Store provider tokens encrypted in Secrets Manager or in DB encrypted using a KMS key.
* Background job to refresh expired connector tokens. If refresh fails, mark account and notify user.
* Respect provider rate limits (connector adapter enforces). Log all token refresh attempts.

---

## 4. OWASP Top-10 mitigations (practical)

### Input validation

* Use `@Valid` and `javax.validation` DTO constraints.
* Reject unknown properties (`spring.jackson.deserialization.FAIL_ON_UNKNOWN_PROPERTIES=true`) to avoid mass assignment.

### Output encoding

* Encode HTML/JS in UI. Backend should return plain text for content; front-end sanitize with a whitelisting sanitizer (DOMPurify).

### SQL injection

* Use Spring Data JPA + parameter binding. Avoid string concatenation. Use `@Query` with parameters or Criteria API.

### CSRF

* For browser clients using cookies, enable Spring Security CSRF protection with double-submit cookie. For SPA using Authorization header, disable CSRF for API endpoints and enforce tokens.

### Broken auth

* Enforce strong password rules (+MFA support later).
* Fail login attempts after N tries with exponential backoff; lock with admin unlock/auto-unlock policy.

### Sensitive data exposure

* Mask PII in logs. Use structured logs and DTOs that omit raw tokens. Use S3 for raw payloads but encrypted.

### Secure headers

* Add CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy in responses (set via `WebMvcConfig`).

### Rate-limiting & brute-force

* Per-IP and per-account limits (see Section 6).

---

## 5. Secrets & Keys

### Where and how

* **AWS Secrets Manager** (recommended) or HashiCorp Vault.
* Store:

  * DB credentials, JWT private keys, OAuth client secrets, provider credentials, encryption KMS keys identifiers.
* Access: AWS IAM Task Role (ECS task role / EC2 instance profile) with `secretsmanager:GetSecretValue` for allowed resources only.

### Rotation & lifecycle

* Rotate DB password every 90 days; rotate JWT keys quarterly. Automate rotation with Lambda or SecretsManager rotation lambda.
* For DB credential rotation, update RDS user and SecretsManager secret in one atomic job then trigger application config reload.

### Development

* Use local `.env` only for local dev and never commit; CI reads secrets from GitHub Actions secrets or Vault.

---

## 6. Transport & Crypto

### TLS

* TLS everywhere: ALB/CloudFront terminate TLS; services communicate over TLS (TLS1.2+).
* Enforce strong ciphers and disable old protocols.

### Passwords and hashing

* Use **bcrypt** (BCryptPasswordEncoder) or **Argon2** for stored passwords. Configure strength (bcrypt 12+).

### At-rest encryption

* RDS encrypted with KMS. S3 objects use SSE-KMS. Redis (Elasticache) in-transit and at-rest if possible.

### JWT crypto

* Use RSA-256 (asymmetric). Private key in Secrets Manager; public key available as JWKS. Rotate via new key id (`kid`) header.

---

## 7. Rate limiting & brute-force protection

### Strategy

* **Two-layer limits**:

  * Global per-IP limit (requests/minute) — protect against DDoS-level abuse. Implement at WAF/ALB level.
  * Application per-account and per-endpoint limits (e.g., analysis requests) — implement in-app using Redis counters.
* **Tools**:

  * **AWS WAF** for coarse IP blocking and rate-based rules.
  * **Bucket4j** with Redis extension or Spring Cloud Gateway RateLimiter for per-account limits.
* **Brute force**:

  * Lock account after N failed attempts for T minutes; log attempts and notify user after threshold.
  * Add CAPTCHA requirement for suspicious flows.

### Implementation snippet (conceptual)

* Use Redis key: `rate:account:{accountId}:endpoint:{ep}` store token bucket data; on breach return `429`.

---

## 8. Audit logging & sensitive-data scrubbing

### Logging format

* Structured JSON logs with fields:

  * `timestamp`, `traceId`, `spanId`, `service`, `level`, `userId`, `actorType`, `accountId`, `action`, `resource`, `outcome`, `message`.
* Include `traceId` from request context for correlating logs/traces.

### What to log

* Auth events: login success/failure, token refresh, token revoke.
* Connector events: token refresh success/fail, rate-limit hits.
* Data changes: who changed what (old/new), `id` references only, not entire payload.
* Admin actions: reprocess, delete, restore.

### Scrubbing & PII

* Never log raw tokens, secrets, or full PII. Replace PII with deterministic token (e.g., `userId:12345`).
* Provide `maskPII()` util to mask: emails as `j***@d***.com`, phone last 4 digits only.
* Keep raw payloads in S3 encrypted; logs reference S3 key only.

### Retention & export

* Store audit logs in CloudWatch / ElasticSearch with retention policy (e.g., 1 year). Provide export path for compliance.

---

## 9. Dependency management & scanning

### Automation

* Enable **Dependabot** or **Renovate** to propose dependency updates.
* Run **Snyk** or **OWASP Dependency-Check** in CI to block builds on critical vulnerabilities.

### Patch cadence

* Weekly PRs for low-risk updates; monthly security maintenance window for major upgrades.
* For critical CVEs, patch within 48 hours depending on severity.

---

## 10. Least privilege infra roles (IAM)

### Service role patterns

* **ECS task role**: grants only access to RDS credentials in SecretsManager, S3 path used by service, SQS queues used by service.
* **Deployment role** (CI/CD): permissions to deploy, but not to read secrets.
* **Monitoring role**: CloudWatch read, not secret-access.
* **Admin role**: minimal number of human admins; use MFA.

### Example IAM policy (S3 read-only for specific bucket)

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:ListBucket"],
    "Resource": ["arn:aws:s3:::reputeai-exports", "arn:aws:s3:::reputeai-exports/*"]
  }]
}
```

* Apply similar least-privilege policies for SecretsManager and SQS.

---

## 11. CI/CD enforcement & checks

### Gates to enforce in CI pipeline

* Static code analysis (SpotBugs, PMD).
* Security scans (Snyk/DependencyCheck).
* Unit & integration tests pass.
* No secrets in code (`git-secrets`).
* Infrastructure plan approvals for Terraform changes (review and approver).
* Auto-deploy only if canary tests pass.

### Secret injection

* CI build reads secrets at deploy time from Secrets Manager or GitHub Actions secrets. Never bake secrets into images.

---

## 12. Monitoring, alerting & incident response

### Key metrics to instrument

* Auth failure rate, token refresh failures, queue depth, failed analysis calls, AI provider error rate, cost per minute of AI calls.
* Set alerts:

  * > 5% auth failure rate in 5m -> Pager duty.
  * Queue depth > threshold -> on-call.
  * AI error spike or cost spike -> Slack/SMS alert.

### Runbooks

* Provide runbook for:

  * DB failover
  * Secrets rotation emergency
  * Revoke JWT keys (rotate, invalidate tokens)
  * Connector credential compromise (revoke, notify users)

---

## 13. Operational practices & schedules

* **Key rotation**: JWT keys quarterly; DB creds 90 days. Document and automate rotations.
* **Backup**: RDS PITR enabled; daily snapshots. Test restores quarterly.
* **Pen test**: annual pentest + on-release VUL triage.
* **Access reviews**: quarterly IAM user and role review.
* **DR Drills**: semi-annual failover test.

---

## 14. Small code examples (copy/paste ready)

### BCrypt password encoder (Spring)

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12); // strength 12
}
```

### JwtProvider (pseudo)

```java
public class JwtProvider {
  private final RSAPrivateKey privateKey;
  private final RSAPublicKey publicKey;
  public String generateToken(UserDetails user) { ... } 
  public Authentication parseToken(String token) { ... }
}
```

Store `privateKey` in Secrets Manager; load at startup via `AwsSecretsManagerClient`.

### Bucket4j + Redis (rate-limiter sketch)

```java
// on each request
Bucket bucket = bucket4jService.resolveBucket(accountId, endpoint);
ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
if (!probe.isConsumed()) {
  return ResponseEntity.status(429).header("X-Rate-Limit-Remaining", "0").build();
}
```

### Masking util (simple)

```java
public static String maskEmail(String email) {
  String[] parts = email.split("@");
  return parts[0].charAt(0) + "***@" + parts[1].replaceAll("(\\w)(?=\\w{2}@)", "*");
}
```

---

## 15. Developer checklist (enforceable)

* [ ] No secrets in code. `git-secrets` installed.
* [ ] JWT keys rotated and in Secrets Manager.
* [ ] OAuth client secrets in Secrets Manager.
* [ ] All DB queries parameterized.
* [ ] DTO validation enabled and tested.
* [ ] CSRF only for cookie-based flows.
* [ ] Rate-limits configured for all heavy endpoints.
* [ ] Audit events emitted for create/update/delete of sensitive resources.
* [ ] Dependabot + Snyk runs in CI.
* [ ] IAM policies for services follow least-privilege principle.
* [ ] Runbooks created for token/key compromise and secret rotation.

---

## 16. How AI should integrate / enforce these rules

* **Scaffold code**: generate `SecurityConfig`, `JwtProvider`, `AuthController` stubs using RSA signing and load secrets from Secrets Manager.
* **Generate checks**: create pre-commit hook templates (`git-secrets`) and CI YAML snippets to run Snyk/Dependabot checks.
* **Generate IaC snippets**: sample Terraform for Secrets Manager secrets, IAM role for ECS task with limited policies.
* **Generate tests**: unit tests for auth flows and integration tests via Testcontainers for DB and localstack for S3/SecretsManager.

---

## 17. Quick incident: "Compromised OAuth client" runbook (3 steps)

1. Revoke provider client secret in provider console.
2. Rotate secret in Secrets Manager and update ECS task role to fetch new version (deploy).
3. Notify affected users and require re-auth; audit logs and store forensic logs for 30 days.

---

## 18. Final notes

* Start with the essentials: TLS, JWT + refresh, Secrets Manager, input validation, SQL param binding, structured logs.
* Add sophistication (ABAC, full CSP, multi-region KMS) after the core is stable.
* Automate as much as possible in CI/CD. Security is repeatable work, not a one-time checklist.


