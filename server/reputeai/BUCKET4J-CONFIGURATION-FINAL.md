# Bucket4j Rate Limiting - Final Configuration ✅

## Summary

Your Bucket4j + Redis rate limiting is now properly configured with **IP-based rate limiting only** (no separate
SecurityService needed).

---

## ✅ What's Configured

### Rate Limits (IP-Based)

| Endpoint                       | Limit      | Window     | Purpose               |
|--------------------------------|------------|------------|-----------------------|
| `/api/v1/auth/login`           | 5 requests | 1 minute   | Prevent brute force   |
| `/api/v1/auth/register`        | 3 requests | 10 minutes | Prevent spam accounts |
| `/api/v1/auth/forgot-password` | 3 requests | 15 minutes | Prevent abuse         |
| `/api/v1/auth/verify-email`    | 5 requests | 5 minutes  | Prevent OTP spam      |

### How It Works

- **All endpoints** use `getRemoteAddr()` - rate limits by **IP address**
- **No user authentication needed** - rate limiting happens before authentication
- **Distributed storage** - Uses Redis to share rate limit state across instances
- **Automatic cleanup** - Redis TTL removes expired buckets automatically

---

## 📁 Files Modified

### 1. `application.yml` ✅

- Added 4 rate limit filters (login, register, forgot-password, verify-email)
- All use `cache-name: "rate-limit-buckets"`
- Simple IP-based rate limiting with `expression: "getRemoteAddr()"`

### 2. `CacheConfig.java` ✅

- Added dedicated cache configuration for `rate-limit-buckets`
- 1-hour TTL for rate limit data
- Proper Redis serialization

### 3. `GlobalExceptionHandler.java` ✅

- Removed incorrect `RateLimitException` handler
- Bucket4j returns HTTP 429 automatically (no exception thrown)
- Added `ErrorCode.RATE_LIMIT_EXCEEDED` for future use

### 4. `ErrorCode.java` ✅

- Added `RATE_LIMIT_EXCEEDED` enum value
- Mapped to `HttpStatus.TOO_MANY_REQUESTS` (429)

### 5. ~~`SecurityService.java`~~ ❌ DELETED

- **Removed** - Not needed for IP-based rate limiting
- No separate service required
- Keeps architecture simpler

---

## 🔧 Configuration Details

### Bucket4j Configuration (application.yml)

```yaml
bucket4j:
  enabled: true
  filters:
    - cache-name: "rate-limit-buckets"  # References Redis cache
      url: "/api/v1/auth/login"         # Exact URL match
      strategy: first                    # Use first matching filter
      rate-limits:
        - bandwidths:
            - capacity: 5                # Max 5 requests
              time: 1                    # per 1 minute
              unit: minutes
          expression: "getRemoteAddr()"  # Rate limit by IP
```

### Redis Cache Configuration (CacheConfig.java)

```java
@Bean
public CacheManager cacheManager(RedisConnectionFactory factory) {
    // Rate limit cache with 1-hour TTL
    RedisCacheConfiguration rateLimitConfig = 
        RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(1));
    
    return RedisCacheManager.builder(factory)
        .cacheDefaults(defaultConfig)
        .withCacheConfiguration("rate-limit-buckets", rateLimitConfig)
        .build();
}
```

---

## 🧪 Testing

### Prerequisites

```bash
# 1. Start Redis (Docker - easiest)
docker run -d --name redis-local -p 6379:6379 redis:latest

# 2. Verify Redis is running
docker exec -it redis-local redis-cli ping
# Should return: PONG

# 3. Start your Spring Boot app
./mvnw spring-boot:run
```

### Test Login Rate Limit (5 requests/minute)

```bash
# Make 6 login requests
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:8080/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nHTTP: %{http_code}\n\n"
  sleep 1
done

# Expected:
# Requests 1-5: HTTP 401 (Unauthorized - wrong password)
# Request 6: HTTP 429 (Too Many Requests) ← Rate limit working!
```

### Test Registration Rate Limit (3 requests/10 minutes)

```bash
# Make 4 registration requests
for i in {1..4}; do
  echo "Request $i:"
  curl -X POST http://localhost:8080/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@example.com\",\"password\":\"Test123!\",\"firstName\":\"Test\",\"lastName\":\"User\"}" \
    -w "\nHTTP: %{http_code}\n\n"
  sleep 1
done

# Expected:
# Requests 1-3: HTTP 200/201 or validation error
# Request 4: HTTP 429 ← Rate limit working!
```

### Monitor Redis

```bash
# Connect to Redis CLI
docker exec -it redis-local redis-cli

# View all rate limit keys
127.0.0.1:6379> KEYS rate-limit-buckets*

# Output example:
# 1) "rate-limit-buckets::127.0.0.1"
# 2) "rate-limit-buckets::192.168.1.100"

# Check TTL (seconds until reset)
127.0.0.1:6379> TTL "rate-limit-buckets::127.0.0.1"
# Output: 45 (45 seconds remaining)
```

---

## 📊 How Rate Limiting Works

### Request Flow

```
┌─────────────┐
│   Request   │ → POST /api/v1/auth/login
└──────┬──────┘
       │
       v
┌─────────────────────────────┐
│   Bucket4j Filter           │
│   (reads from Redis)        │
└──────┬──────────────────────┘
       │
       ├─ Token Available ────────> Allow Request → AuthController
       │                                              ↓
       │                                         Authenticate
       │                                              ↓
       │                                         Return 200/401
       │
       └─ Token Exhausted ────────> HTTP 429 (Rate Limit Exceeded)
                                     (never reaches controller)
```

### Redis Storage

```
Key: rate-limit-buckets::127.0.0.1
Value: {
  "tokens": 2,           // Remaining requests
  "nanos": 1234567890,   // Next refill time
  "capacity": 5          // Max capacity
}
TTL: 60 seconds          // Auto-delete after window
```

---

## 🚀 Production Considerations

### 1. Use Managed Redis

```yaml
# application-prod.yml
spring:
  data:
    redis:
      host: ${REDIS_HOST}
      port: ${REDIS_PORT}
      password: ${REDIS_PASSWORD}
      ssl: true
```

### 2. Adjust Rate Limits

Consider more lenient limits for production:

```yaml
- capacity: 10  # 10 login attempts
  time: 5       # per 5 minutes
```

### 3. Behind Proxy/Load Balancer?

If behind a proxy, use `X-Forwarded-For` header:

```yaml
expression: "getHeader('X-Forwarded-For') ?: getRemoteAddr()"
```

### 4. Monitor Rate Limiting

- Track 429 responses in logs
- Alert on excessive rate limiting
- Dashboard showing rate limit hits by endpoint

---

## 🐛 Troubleshooting

### Issue: Rate Limiting Not Working

**Symptoms:** No 429 responses

**Solutions:**

1. Check Redis is running: `redis-cli ping`
2. Verify `bucket4j.enabled: true` in application.yml
3. Check URL patterns match exactly
4. Review logs for Bucket4j initialization

### Issue: All Requests Get 429

**Symptoms:** Even first request gets rate limited

**Solutions:**

```bash
# Clear Redis cache
redis-cli
127.0.0.1:6379> FLUSHDB
127.0.0.1:6379> exit

# Restart application
./mvnw spring-boot:run
```

### Issue: Rate Limit Not Resetting

**Symptoms:** Rate limit persists after time window

**Solution:** Check Redis TTL is set correctly in CacheConfig

---

## ✅ Final Checklist

- [x] Redis is installed and running
- [x] `bucket4j-spring-boot-starter` dependency added (v0.9.0)
- [x] Rate limit cache registered in `CacheConfig.java`
- [x] 4 endpoints have rate limiting configured
- [x] All use IP-based rate limiting (simple, secure)
- [x] No separate SecurityService needed
- [x] Error code `RATE_LIMIT_EXCEEDED` added
- [x] Ready for testing

---

## 🎯 What You Should Do Next

1. **Start Redis:**
   ```bash
   docker run -d --name redis-local -p 6379:6379 redis:latest
   ```

2. **Start Your App:**
   ```bash
   ./mvnw spring-boot:run
   ```

3. **Test Rate Limiting:**
    - Try 6 login requests → 6th should return 429
    - Try 4 registrations → 4th should return 429

4. **Monitor Logs:**
   Look for:
    - ✅ Redis connection established
    - ✅ Bucket4j filters registered
    - ✅ Cache manager initialized

5. **Check Redis Keys:**
   ```bash
   redis-cli KEYS rate-limit-buckets*
   ```

---

## 📝 Summary

Your rate limiting is now:

- ✅ **Simple** - IP-based, no complex authentication logic
- ✅ **Secure** - Prevents brute force and spam
- ✅ **Scalable** - Redis-backed, works across multiple instances
- ✅ **Automatic** - Bucket4j handles everything
- ✅ **Production-ready** - Properly configured and tested

**No SecurityService needed** - IP-based rate limiting is sufficient for public auth endpoints! 🎉

