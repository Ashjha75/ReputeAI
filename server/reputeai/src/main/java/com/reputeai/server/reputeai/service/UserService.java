package com.reputeai.server.reputeai.service;

import com.reputeai.server.reputeai.domain.dto.UserDto;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

public interface UserService extends UserDetailsService {
    @Override
    UserDetails loadUserByUsername(String email) throws UsernameNotFoundException;
    UserDto findUserById(Long id);
}
