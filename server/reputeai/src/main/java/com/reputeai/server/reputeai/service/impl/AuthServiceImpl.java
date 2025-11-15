package com.reputeai.server.reputeai.service.impl;

import com.reputeai.server.reputeai.domain.dto.LoginRequestDto;
import com.reputeai.server.reputeai.domain.dto.LoginResponseDto;
import com.reputeai.server.reputeai.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    // Obtain AuthenticationManager from configuration to avoid early autowire issues
    private final AuthenticationConfiguration authenticationConfiguration;

    private AuthenticationManager authenticationManager() throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Override
    public LoginResponseDto login(LoginRequestDto loginRequestDto) {
        try {
            Authentication authentication = authenticationManager().authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequestDto.getEmail(),
                            loginRequestDto.getPassword()
                    )
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String accessToken = "accessToken"; // TODO generate real JWT
            String refreshToken = "dummy-refresh-token"; // TODO generate refresh token
            return new LoginResponseDto(accessToken, refreshToken);
        } catch (Exception ex) {
            throw new RuntimeException("Authentication failed", ex);
        }
    }

    @Override
    public LoginResponseDto refreshToken(String refreshToken) {
        throw new UnsupportedOperationException("Refresh token logic not yet implemented.");
    }
}