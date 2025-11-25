package com.reputeai.server.reputeai.security.oauth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Fetches user email from GitHub's /user/emails endpoint.
 * This is necessary because GitHub users can keep their email private,
 * causing the standard OAuth response to return null for email.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GitHubEmailFetcher {

    private final RestTemplate restTemplate;

    /**
     * Fetch primary verified email from GitHub's /user/emails endpoint.
     *
     * @param accessToken GitHub OAuth access token
     * @return Primary verified email or null if not found
     */
    public String fetchPrimaryEmail(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            headers.add("User-Agent", "ReputeAI-OAuth-App");

            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<List> response = restTemplate.exchange(
                    "https://api.github.com/user/emails",
                    HttpMethod.GET,
                    entity,
                    List.class
            );

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> emails = response.getBody();

            if (emails != null && !emails.isEmpty()) {
                // Priority 1: Find primary verified email
                for (Map<String, Object> emailData : emails) {
                    Boolean primary = (Boolean) emailData.get("primary");
                    Boolean verified = (Boolean) emailData.get("verified");
                    String email = (String) emailData.get("email");

                    if (Boolean.TRUE.equals(primary) && Boolean.TRUE.equals(verified) && email != null) {
                        log.info("Found primary verified email from GitHub: {}", email);
                        return email;
                    }
                }

                // Priority 2: Any verified email
                for (Map<String, Object> emailData : emails) {
                    Boolean verified = (Boolean) emailData.get("verified");
                    String email = (String) emailData.get("email");

                    if (Boolean.TRUE.equals(verified) && email != null) {
                        log.info("Found verified email from GitHub: {}", email);
                        return email;
                    }
                }

                // Priority 3: Any email (last resort)
                for (Map<String, Object> emailData : emails) {
                    String email = (String) emailData.get("email");
                    if (email != null && !email.isBlank()) {
                        log.warn("Using unverified email from GitHub: {}", email);
                        return email;
                    }
                }
            }

            log.warn("No emails found in GitHub response");

        } catch (Exception e) {
            log.error("Failed to fetch GitHub emails: {}", e.getMessage(), e);
        }

        return null;
    }
}

