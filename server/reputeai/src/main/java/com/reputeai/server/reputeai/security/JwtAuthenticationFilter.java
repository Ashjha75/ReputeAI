package com.reputeai.server.reputeai.security;

import com.reputeai.server.reputeai.service.UserService;
import com.reputeai.server.reputeai.util.CookieUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final UserService userService;
    private final CookieUtil cookieUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);

            if (jwt != null && jwtProvider.validateToken(jwt)) {
                String username = jwtProvider.getUsernameFromJwt(jwt);

                // Load user details (this will hit the cache or DB via our UserServiceImpl)
                UserDetails userDetails = userService.loadUserByUsername(username);

                // Create authentication token
                UsernamePasswordAuthenticationToken authentication =
                        // Use empty string for credentials to avoid null-password issues in downstream code
                        new UsernamePasswordAuthenticationToken(userDetails, "", userDetails.getAuthorities());

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Set authentication in the security context
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extract JWT token from request.
     * Priority: 1) Cookie, 2) Authorization header (for mobile/non-browser clients)
     */
    private String parseJwt(HttpServletRequest request) {
        // First try to get token from cookie
        String tokenFromCookie = cookieUtil.getAccessTokenFromCookies(request);
        if (tokenFromCookie != null) {
            log.trace("JWT token extracted from cookie");
            return tokenFromCookie;
        }

        // Fallback to Authorization header
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            log.trace("JWT token extracted from Authorization header");
            return headerAuth.substring(7);
        }

        return null;
    }
}