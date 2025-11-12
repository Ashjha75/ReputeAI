**Redis Caching — Practical Standards (Production-grade)**

---

### 1. What to Cache

* Read-heavy data (profiles, dashboards, reference tables).
* Computation/aggregation results.
* External API responses.
* Avoid caching source-of-truth or high-frequency write data.

---

### 2. Caching Pattern — *Cache-Aside (Standard)*

* **Read:** check cache → fallback to DB → set cache.
* **Write:** update DB → invalidate cache key.
* Reliable, simple, widely adopted.

---

### 3. Key Design

* Namespaced pattern: `entity:subtype:id[:field][:version]`.

  * Example: `user:123:profile:v1`
* Always serialize objects as JSON or MsgPack (no Java serialization).
* Add version suffix to invalidate schema changes cleanly.

---

### 4. TTL Strategy

* Short-lived (1–5 min): volatile data, dashboards.
* Medium (30 min–2 h): user profiles, config lookups.
* Long (1–24 h): static reference data.
* Add ± 10 % **TTL jitter** to prevent mass expiry (cache stampede).

---

### 5. Invalidation & Consistency

* On DB write: `redis.del(key)` or publish invalidation event.
* For multiple instances, use **Redis Pub/Sub** or **Spring Cache sync** to notify peers.
* Never rely solely on TTL for correctness.

---

### 6. Stampede Protection

* Use **SETNX lock key** or **Redisson RLock** before heavy recomputation.
* Only one thread rebuilds cache; others wait or serve stale.
* Use “stale-while-revalidate” when possible: serve expired value while async refresh runs.

---

### 7. Memory & Eviction

* Set `maxmemory` and policy:

  * `volatile-lru` → evict least-used expiring keys first.
  * `allkeys-lru` → safer default for cache-only Redis.
* Monitor: hit ratio > 0.9, latency < 2 ms, evictions ≈ 0.
* Use metrics from `INFO stats` or CloudWatch.

---

### 8. Security

* Deploy in **private subnet**, not public Internet.
* Enable Redis AUTH and TLS.
* For Redis 6+: use ACLs per app role.
* Rotate auth tokens quarterly.

---

### 9. Spring Boot Integration (baseline)

```java
@Configuration
@EnableCaching
public class CacheConfig {
  @Bean
  public RedisCacheConfiguration cacheConfig() {
    return RedisCacheConfiguration.defaultCacheConfig()
      .entryTtl(Duration.ofMinutes(10))
      .disableCachingNullValues()
      .computePrefixWith(name -> "reputeai:" + name + ":");
  }
}
```

Usage:

```java
@Cacheable(value="userProfile", key="#userId")
public UserDto getUserProfile(Long userId) { ... }

@CacheEvict(value="userProfile", key="#user.id")
public void updateUser(User user) { ... }
```

---

### 10. Monitoring & Alerts

Track via CloudWatch / Prometheus:

* `cache_hits`, `cache_misses`, `evicted_keys`, `used_memory`.
  Alert when hit ratio < 0.8 or memory > 85 %.

---

**Rule of thumb:**

> *Cache for performance, not persistence. Keep keys small, TTLs realistic, and invalidation reliable.*
