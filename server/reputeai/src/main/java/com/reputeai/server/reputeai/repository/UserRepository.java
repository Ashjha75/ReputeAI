package com.reputeai.server.reputeai.repository;

import com.reputeai.server.reputeai.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for the User entity.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their email address. Eagerly fetches roles and permissions.
     * This is the primary method used by the UserDetailsService for authentication.
     *
     * @param email The user's email address.
     * @return An Optional containing the User if found.
     */
    Optional<User> findByEmail(String email);

    /**
     * Checks if a user with the given email already exists.
     * This is used during registration to prevent duplicate accounts.
     *
     * @param email The email to check.
     * @return true if a user with this email exists, false otherwise.
     */
    Boolean existsByEmail(String email);
}