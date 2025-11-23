package com.reputeai.server.reputeai.security;

import com.reputeai.server.reputeai.domain.dto.LoginResponseDto;
import com.reputeai.server.reputeai.service.AuthService;
import com.reputeai.server.reputeai.util.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * Handles successful OAuth2 authentication.
 * Processes the OAuth2 user, generates JWT tokens, and redirects to frontend.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;
    private final CookieUtil cookieUtil;

    @Value("${app.oauth2.redirect-uri:http://localhost:3000/oauth2/redirect}")
    private String oauth2RedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oauth2User = oauthToken.getPrincipal();
        String registrationId = oauthToken.getAuthorizedClientRegistrationId();

        log.info("OAuth2 login success for provider: {}", registrationId);

        try {
            // Process OAuth2 user (create/update user, generate JWT)
            LoginResponseDto loginResponse = authService.processOAuth2Login(oauth2User, registrationId);

            // Set tokens in httpOnly cookies
            cookieUtil.setAuthCookies(response,
                    loginResponse.getAccessToken(),
                    loginResponse.getRefreshToken());

            // Redirect to frontend with success
            String redirectUrl = UriComponentsBuilder.fromUriString(oauth2RedirectUri)
                    .queryParam("success", "true")
                    .build()
                    .toUriString();

            log.info("OAuth2 login successful, redirecting to: {}", redirectUrl);
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);

        } catch (Exception e) {
            log.error("OAuth2 login processing failed: {}", e.getMessage(), e);

            // Redirect to frontend with error
            String redirectUrl = UriComponentsBuilder.fromUriString(oauth2RedirectUri)
                    .queryParam("success", "false")
                    .queryParam("error", e.getMessage())
                    .build()
                    .toUriString();

            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        }
    }
}