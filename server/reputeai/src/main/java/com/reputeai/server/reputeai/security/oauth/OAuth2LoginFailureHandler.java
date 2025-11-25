package com.reputeai.server.reputeai.security.oauth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * Handles OAuth2 authentication failures.
 * Redirects to frontend with error information.
 */
@Component
@Slf4j
public class OAuth2LoginFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    // Default changed to 4200 for local Angular dev; can still be overridden via environment
    @Value("${app.oauth2.redirect-uri:http://localhost:4200/oauth2/redirect}")
    private String oauth2RedirectUri;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {

        log.error("OAuth2 authentication failed: {}", exception.getMessage());

        String redirectUrl = UriComponentsBuilder.fromUriString(oauth2RedirectUri)
                .queryParam("success", "false")
                .queryParam("error", "OAuth2 authentication failed")
                .build()
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}