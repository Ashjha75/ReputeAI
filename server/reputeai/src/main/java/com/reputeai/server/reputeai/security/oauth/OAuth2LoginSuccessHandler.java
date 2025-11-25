package com.reputeai.server.reputeai.security.oauth;

import com.reputeai.server.reputeai.domain.dto.LoginResponseDto;
import com.reputeai.server.reputeai.service.OAuthUserService;
import com.reputeai.server.reputeai.util.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Handles successful OAuth2 authentication.
 * Processes the OAuth2 user, generates JWT tokens, and redirects to frontend.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final OAuthUserService oAuthUserService;
    private final CookieUtil cookieUtil;
    private final OAuth2AuthorizedClientService authorizedClientService;
    private final GitHubEmailFetcher gitHubEmailFetcher;

    @Value("${app.oauth2.redirect-uri:http://localhost:4200/oauth2/redirect}")
    private String oauth2RedirectUri;

    @Value("${app.cookie.secure:false}")
    private boolean secureCookie;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oauth2User = oauthToken.getPrincipal();
        String registrationId = oauthToken.getAuthorizedClientRegistrationId();

        log.info("OAuth2 login success for provider: {}", registrationId);

        try {
            // Get original attributes
            Map<String, Object> attributes = new HashMap<>(oauth2User.getAttributes());

            // Special handling for GitHub email - fetch from /user/emails if email is null
            if ("github".equalsIgnoreCase(registrationId) && attributes.get("email") == null) {
                log.info("GitHub did not provide email in user info, fetching from /user/emails endpoint");

                // Get OAuth2 access token
                OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient(
                        registrationId,
                        oauthToken.getName()
                );

                if (client != null && client.getAccessToken() != null) {
                    String accessToken = client.getAccessToken().getTokenValue();
                    String email = gitHubEmailFetcher.fetchPrimaryEmail(accessToken);

                    if (email != null) {
                        attributes.put("email", email);
                        log.info("Successfully fetched email from GitHub /user/emails endpoint");
                    } else {
                        log.warn("Failed to fetch email from GitHub, user may not have any public/verified emails");
                    }
                }
            }

            // Process OAuth2 login with updated attributes
            LoginResponseDto loginResponse = oAuthUserService.processOAuth2Login(
                    oauth2User,
                    registrationId,
                    attributes
            );

            // Set tokens in httpOnly cookies
            cookieUtil.setAuthCookies(response,
                    loginResponse.getAccessToken(),
                    loginResponse.getRefreshToken());

            // Build redirect URL
            UriComponentsBuilder ub = UriComponentsBuilder.fromUriString(oauth2RedirectUri)
                    .queryParam("success", "true");

            // If cookies are NOT secure (development), include token in URL for fallback
            if (!secureCookie && loginResponse.getAccessToken() != null) {
                ub.queryParam("token", loginResponse.getAccessToken());
            }

            String redirectUrl = ub.build().toUriString();

            log.info("OAuth2 login successful for user: {}, redirecting to: {}",
                    loginResponse.getEmail(), redirectUrl);

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