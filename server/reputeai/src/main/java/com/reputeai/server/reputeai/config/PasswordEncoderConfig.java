package com.reputeai.server.reputeai.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Provides the PasswordEncoder bean independent of security filter chain configuration
 * to avoid circular dependency issues.
 */
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        // strength 12 is a good balance for dev; tune higher for production if resources allow
        return new BCryptPasswordEncoder(12);
    }
}

