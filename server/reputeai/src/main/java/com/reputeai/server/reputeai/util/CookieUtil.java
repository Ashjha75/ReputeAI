package com.reputeai.server.reputeai.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Utility class for managing secure httpOnly cookies for authentication tokens.
 */
@Component
@Slf4j
public class CookieUtil {

    public static final String ACCESS_TOKEN_COOKIE = "accessToken";
    public static final String REFRESH_TOKEN_COOKIE = "refreshToken";
    private static final int ACCESS_TOKEN_MAX_AGE = 30 * 60; // 30 minutes
    private static final int REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
    @Value("${app.cookie.secure:false}")
    private boolean secureCookie;
    @Value("${app.cookie.domain:}")
    private String cookieDomain;

    /**
     * Set both access and refresh token cookies.
     */
    public void setAuthCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        setAccessTokenCookie(response, accessToken);
        setRefreshTokenCookie(response, refreshToken);
        log.debug("Set auth cookies: accessToken and refreshToken");
    }

    /**
     * Set access token cookie - short lived (30 minutes).
     */
    public void setAccessTokenCookie(HttpServletResponse response, String accessToken) {
        Cookie cookie = createCookie(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_TOKEN_MAX_AGE);
        cookie.setPath("/");
        response.addCookie(cookie);
        log.trace("Set accessToken cookie");
    }

    /**
     * Set refresh token cookie - long lived (7 days).
     * Only accessible at /api/v1/auth/refresh for security.
     */
    public void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = createCookie(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_TOKEN_MAX_AGE);
        cookie.setPath("/api/v1/auth/refresh");
        response.addCookie(cookie);
        log.trace("Set refreshToken cookie");
    }

    /**
     * Clear both auth cookies (for logout).
     */
    public void clearAuthCookies(HttpServletResponse response) {
        clearCookie(response, ACCESS_TOKEN_COOKIE, "/");
        clearCookie(response, REFRESH_TOKEN_COOKIE, "/api/v1/auth/refresh");
        log.debug("Cleared auth cookies");
    }

    /**
     * Extract access token from request cookies.
     */
    public String getAccessTokenFromCookies(HttpServletRequest request) {
        return getCookieValue(request, ACCESS_TOKEN_COOKIE);
    }

    /**
     * Extract refresh token from request cookies.
     */
    public String getRefreshTokenFromCookies(HttpServletRequest request) {
        return getCookieValue(request, REFRESH_TOKEN_COOKIE);
    }

    /**
     * Create a secure httpOnly cookie.
     */
    private Cookie createCookie(String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setSecure(secureCookie); // Set true in production (HTTPS)
        cookie.setMaxAge(maxAge);
        // Use Lax for development (allows cookies on cross-site GET requests)
        // Change to Strict in production for better security
        cookie.setAttribute("SameSite", secureCookie ? "Strict" : "Lax");

        if (cookieDomain != null && !cookieDomain.isBlank()) {
            cookie.setDomain(cookieDomain);
        }

        return cookie;
    }

    /**
     * Clear a cookie by setting maxAge to 0.
     */
    private void clearCookie(HttpServletResponse response, String name, String path) {
        Cookie cookie = new Cookie(name, null);
        cookie.setPath(path);
        cookie.setHttpOnly(true);
        cookie.setSecure(secureCookie);
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    /**
     * Get cookie value from request.
     */
    private String getCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (name.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}

