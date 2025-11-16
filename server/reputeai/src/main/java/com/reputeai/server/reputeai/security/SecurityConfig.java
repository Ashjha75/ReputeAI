package com.patientmanagement.patientservice.security;

import com.reputeai.server.reputeai.security.AuthEntryPointJwt;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.Duration;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // This enables @PreAuthorize annotations to work
@RequiredArgsConstructor
public class SecurityConfig {

    private final AuthEntryPointJwt unauthorizedHandler;
//    private final Oauth2SuccessHandler oauth2SuccessHandler;

//    @Bean
//    public AuthTokenFilter authenticationTokenFilterBean() {
//        return new AuthTokenFilter();
//    }

    @Bean
    SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable).cors(cors -> cors.configurationSource(corsConfigurationSource())).exceptionHandling(ex -> ex.authenticationEntryPoint(unauthorizedHandler)).sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).authorizeHttpRequests(auth -> auth
//                .requestMatchers("/api/v1/patient/**").hasRole("ADMIN")
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/v1/auth/**",
                                "/api/public/**",
                                "/api/external/**",
                                "/api/v1/docs/**",
                                "/v3/api-docs/**",
                                "/api/v1/swagger-ui/**",
                                "/api/v1/swagger-ui.html",
                                "/api/v1/swagger-resources/**",
                                "/webjars/**",
                                "/health",
                                "/favicon.ico",
                                "/api/v1/login",
                                "/api/v1/login/google",
                                "/api/v1/login/github",
                                "/oauth2/**",
                                "/login/oauth2/**",
                                "/api/v1/login/oauth2/**",
                                "/verify-email"
                        ).permitAll()
                        .anyRequest().authenticated()
        ).headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin));

//        http.addFilterBefore(authenticationTokenFilterBean(), UsernamePasswordAuthenticationFilter.class);

//        http.oauth2Login(oauth -> oauth
//                .failureHandler((request, response, exception) -> {
//                    // Consider redirecting to a UI error page instead of throwing
//                    response.sendRedirect("/error?message=oauth_failed");
//                })
//                .successHandler(oauth2SuccessHandler)
//                // ✅ The redirectionEndpoint is now correctly placed inside the lambda
//                .redirectionEndpoint(endpoint ->
//                        endpoint.baseUri("/login/oauth2/code/*")
//                )
//        );
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("http://localhost:*", "https://mydomain.com"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(Duration.ofHours(1));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

}