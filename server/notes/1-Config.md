# Configuration & Environment Management — Essential Notes for a 2-Year Spring Boot Developer

**1. Use Profiles Correctly**

* Keep separate configs: `application-local.yml`, `application-dev.yml`, `application-prod.yml`.
* Never hardcode profile in code. Activate via environment:
  `SPRING_PROFILES_ACTIVE=dev`.

**2. Externalize All Config**

* No environment-specific values inside the jar.
* Use placeholders:

  ```yaml
  spring.datasource.url: ${DB_URL}
  ```

**3. Protect Secrets**

* No passwords, tokens, keys in Git.
* Load secrets via environment variables or vault.
* Add `.gitignore` entries for any local override files.

**4. Keep Config Minimal & Structured**

* Group logically:

  ```yaml
  app:
    api:
      base-path: /api/v1
  ```
* Avoid nested clutter; maintain consistent naming.

**5. Use YAML Over Properties**

* Clear hierarchy, easier structure.
* Keep all configs under `src/main/resources`.

**6. Fail Fast on Startup**

* Misconfigurations should stop boot quickly.
* Validate required environment variables at startup if needed.

**7. Avoid Environment Logic in Code**

* No `if(dev)` switches in Java.
* Use profile-specific beans or configs via `@Profile`.

**8. Log Configuration on Startup (Non-Sensitive)**

* Print active profile and non-secret configs for visibility.


