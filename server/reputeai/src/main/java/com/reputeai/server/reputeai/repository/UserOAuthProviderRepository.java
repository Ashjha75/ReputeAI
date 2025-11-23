package com.reputeai.server.reputeai.repository;

import com.reputeai.server.reputeai.domain.entity.User;
import com.reputeai.server.reputeai.domain.entity.UserOAuthProvider;
import com.reputeai.server.reputeai.util.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserOAuthProviderRepository extends JpaRepository<UserOAuthProvider, Long> {

    /**
     * Find OAuth provider link by provider and provider's unique ID.
     */
    Optional<UserOAuthProvider> findByProviderAndProviderId(AuthProvider provider, String providerId);

    /**
     * Find OAuth provider link for a specific user and provider.
     */
    Optional<UserOAuthProvider> findByUserAndProvider(User user, AuthProvider provider);

    /**
     * Check if provider is linked to a user.
     */
    boolean existsByUserAndProvider(User user, AuthProvider provider);

    /**
     * Delete all OAuth providers for a user.
     */
    void deleteByUser(User user);
}