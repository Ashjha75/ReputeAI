package com.reputeai.server.reputeai.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

/**
 * Configures the CacheManager for Redis, using JSON serialization for values.
 * This ensures that cached objects are stored in a portable, language-agnostic format.
 */
@Configuration
@EnableCaching
@RequiredArgsConstructor
public class CacheConfig {

    // Inject the ObjectMapper bean that is already configured with the JavaTimeModule in AppConfig.
    private final ObjectMapper objectMapper;

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {

        // 1. Create a JSON serializer using our pre-configured ObjectMapper.
        // This ensures that Java 8+ time objects (Instant, etc.) are handled correctly.
        GenericJackson2JsonRedisSerializer jsonRedisSerializer =
                new GenericJackson2JsonRedisSerializer(objectMapper);

        // 2. Define the default cache configuration (for general caching).
        RedisCacheConfiguration defaultCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                // Set a default Time-To-Live (TTL) for cache entries.
                .entryTtl(Duration.ofMinutes(10))

                // Use a String serializer for the cache keys.
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer())
                )

                // Use our custom JSON serializer for the cache values.
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(jsonRedisSerializer)
                )

                // Do not cache null values, which prevents potential issues with some caching strategies.
                .disableCachingNullValues();

        // 3. Define specific cache configuration for Bucket4j rate limiting
        RedisCacheConfiguration rateLimitCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1)) // Rate limit buckets live for 1 hour
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer())
                )
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(jsonRedisSerializer)
                )
                .disableCachingNullValues();

        // 4. Build the RedisCacheManager with both default and custom cache configurations.
        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(defaultCacheConfig)
                // Register the rate-limit-buckets cache used by Bucket4j
                .withCacheConfiguration("auth-limit", rateLimitCacheConfig)
                .withCacheConfiguration("buckets", rateLimitCacheConfig) // <-- Added for Bucket4j
                .build();
    }
}