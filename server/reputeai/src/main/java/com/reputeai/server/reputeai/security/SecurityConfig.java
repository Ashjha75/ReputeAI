package com.reputeai.server.reputeai.security;

import com.reputeai.server.reputeai.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Enables @PreAuthorize for RBAC
@RequiredArgsConstructor
public class SecurityConfig {

    private final ObjectProvider<JwtAuthenticationFilter> jwtAuthenticationFilterProvider;
    private final AuthEntryPointJwt unauthorizedHandler;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    // Added: single source of truth for publicly accessible endpoints
    // /api/v1/auth/** covers: /login, /signup, /refresh, /logout
    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/v1/auth/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/api/v1/swagger-ui/**",
            "/api/v1/swagger-ui.html",
            "/api/v1/docs/**",
            "/actuator/health",
            "/favicon.ico",
            "/error"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> {}) // Enable CORS using CorsConfigurationSource bean if present
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(ex -> ex.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .anyRequest().authenticated()
                );

        // Add our custom JWT filter before the standard authentication filter (resolved lazily)
        JwtAuthenticationFilter jwtFilter = jwtAuthenticationFilterProvider.getIfAvailable();
        if (jwtFilter != null) {
            http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        }

        return http.build();
    }

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring().requestMatchers(
                "/v3/api-docs/**",
                "/swagger-ui/**",
                "/swagger-ui.html",
                "/webjars/**",
                "/favicon.ico"
        );
    }

    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }

    // Adapter bean: expose the UserService implementation as a UserDetailsService bean
    @Bean
    public UserDetailsService userDetailsService(UserService userService) {
        return userService;
    }
}