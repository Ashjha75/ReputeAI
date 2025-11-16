package com.reputeai.server.reputeai.repository;

import com.reputeai.server.reputeai.domain.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * Finds a role by its name (e.g., "USER", "ADMIN").
     *
     * @param name The name of the role.
     * @return An Optional containing the Role if found.
     */
    Optional<Role> findByName(String name);
}