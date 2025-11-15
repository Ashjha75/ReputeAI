package com.reputeai.server.reputeai.util; // Your package name

// These imports will now work correctly
import com.reputeai.server.reputeai.domain.dto.UserDto;
import com.reputeai.server.reputeai.domain.entity.User;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.stream.Collectors; // Add this import

/**
 * MapStruct interface for mapping all DTOs to Entities and vice-versa.
 * Uses componentModel="spring" so Spring can inject it into services.
 * Ignores unmapped targets to avoid build failures on minor DTO changes.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface Mapper {

    /**
     * Converts a User Entity to a UserDto.
     * This is used when returning user data from an API endpoint.
     * It automatically maps fields with the same name (id, email, firstName, lastName).
     *
     * @param user The JPA Entity.
     * @return The DTO for the client.
     */
    @Mapping(target = "fullName", expression = "java(user.getFirstName() + \" \" + user.getLastName())")
    @Mapping(target = "roles", expression = "java(user.getRoles().stream().map(role -> role.getName()).collect(Collectors.toSet()))")
    UserDto toUserDto(User user);
}