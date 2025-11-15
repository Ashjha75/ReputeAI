// File: src/main/java/com/reputeai/server/reputeai/util/ApplicationMapper.java

package com.reputeai.server.reputeai.util;

import com.reputeai.server.reputeai.domain.dto.UserDto;
import com.reputeai.server.reputeai.domain.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.stream.Collectors;

/**
 * MapStruct interface for mapping all DTOs to Entities and vice-versa.
 * RENAMED to ApplicationMapper to avoid name collision with the @Mapper annotation.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ApplicationMapper {

    /**
     * Converts a User Entity to a UserDto.
     */
    @Mapping(target = "fullName", expression = "java(user.getFirstName() + \" \" + user.getLastName())")
    @Mapping(target = "roles", expression = "java(user.getRoles().stream().map(role -> role.getName()).collect(Collectors.toSet()))")
    UserDto toUserDto(User user);

}