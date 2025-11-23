package com.reputeai.server.reputeai.repository;

import com.reputeai.server.reputeai.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by email (unique globally).
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if email exists.
     */
    boolean existsByEmail(String email);

    /**
     * Find user by email with roles and permissions eagerly loaded.
     * Optimized for authentication.
     */
    @Query("SELECT u FROM User u " +
            "LEFT JOIN FETCH u.roles r " +
            "LEFT JOIN FETCH r.permissions " +
            "LEFT JOIN FETCH u.oauthProviders " +
            "WHERE u.email = :email")
    Optional<User> findByEmailWithRolesAndPermissions(@Param("email") String email);
}