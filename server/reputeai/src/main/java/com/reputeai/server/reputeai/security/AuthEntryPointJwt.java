package com.reputeai.server.reputeai.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT Authentication Entry Point for handling unauthorized access attempts.
 *
 * <p>This component intercepts authentication failures and returns standardized
 * JSON error responses instead of default Spring Security error pages.
 *
 * <h3>Main Steps:</h3>
 * <ol>
 *   <li><strong>Logs unauthorized access</strong> - Records the request URI for security monitoring</li>
 *   <li><strong>Sets response headers</strong> - Configures JSON content type and 401 status</li>
 *   <li><strong>Creates error response body</strong> - Builds standardized JSON with status, error, message, path, and timestamp</li>
 *   <li><strong>Writes JSON response</strong> - Serializes error object to response stream</li>
 * </ol>
 *
 * <h3>Key Features:</h3>
 * <ul>
 *   <li>Returns consistent JSON format for all authentication failures</li>
 *   <li>Prevents exposure of internal security details</li>
 *   <li>Provides client-friendly error messages</li>
 *   <li>Includes request context (path, timestamp) for debugging</li>
 * </ul>
 *
 * <p><strong>When triggered:</strong> Any request to protected endpoints without valid JWT token
 * or expired/invalid authentication credentials.
 *
 * @see AuthenticationEntryPoint
 * @see AuthenticationException
 */


@Slf4j
@Component
public class AuthEntryPointJwt implements AuthenticationEntryPoint {


    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        String requestURI = request.getRequestURI();
        log.error("Unauthorized access attempt - URI: {}", requestURI);

        // Set response headers
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);


        // Create standardized error response
        final Map<String, Object> body = new HashMap<>();
        body.put("status", HttpServletResponse.SC_UNAUTHORIZED);
        body.put("error", "Unauthorized");

        // Generic message - don't expose internal details
        body.put("message", "Authentication required to access this resource");
        body.put("path", requestURI);
        body.put("timestamp", Instant.now().toString());

        // Write JSON response
        final ObjectMapper mapper = new ObjectMapper();
        mapper.writeValue(response.getOutputStream(), body);
    }
}
