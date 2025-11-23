package com.reputeai.server.reputeai.config;

import com.reputeai.server.reputeai.domain.entity.AuthenticatedUser;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class AuditingConfig {

    /**
     * Provides the ID of the current authenticated user for the 'createdBy' field.
     */
    @Bean
    public AuditorAware<Long> auditorProvider() {
        return () -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated()) {
                // Return null/empty for jobs (SYSTEM user) or unauthenticated access
                return Optional.empty();
            }

            Object principal = authentication.getPrincipal();

            // Check if the principal is our custom AuthenticatedUser (from JWT)
            if (principal instanceof AuthenticatedUser authenticatedUser) {
                return Optional.of(authenticatedUser.getUserId());
            }

            // Fallback for system user (e.g., SYSTEM role or default ID)
            return Optional.of(0L);
        };
    }
}