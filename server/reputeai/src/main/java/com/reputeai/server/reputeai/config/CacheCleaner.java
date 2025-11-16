package com.reputeai.server.reputeai.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;

@Component
public class CacheCleaner implements ApplicationRunner {

    private final CacheManager cacheManager;

    public CacheCleaner(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // Clear user details cache at startup to avoid stale serialized values (LinkedHashMap) being returned
        if (cacheManager != null) {
            var cache = cacheManager.getCache("userDetailsByEmail");
            if (cache != null) cache.clear();
        }
    }
}

