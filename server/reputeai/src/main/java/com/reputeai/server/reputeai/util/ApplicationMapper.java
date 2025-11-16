// File: src/main/java/com/reputeai/server/reputeai/util/ApplicationMapper.java

package com.reputeai.server.reputeai.util;

import com.reputeai.server.reputeai.domain.dto.UserDto;
import com.reputeai.server.reputeai.domain.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.stream.Collectors; // <-- Import here so the `imports` attribute can find it

/**
 * MapStruct interface for mapping all DTOs to Entities and vice-versa.
 */
@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        imports = {Collectors.class} // <-- THIS IS THE FIX
)
public interface ApplicationMapper {

    /**
     * Converts a User Entity to a UserDto.
     */
    @Mapping(target = "fullName", expression = "java(user.getFirstName() + \" \" + user.getLastName())")
    @Mapping(target = "roles", expression = "java(user.getRoles().stream().map(role -> role.getName()).collect(Collectors.toSet()))")
    UserDto toUserDto(User user);

}