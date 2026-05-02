package com.marketplace.user.infrastructure.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class CookieUtil {

    @Value("${cookie.domain:}")
    private String cookieDomain;

    @Value("${cookie.secure:true}")
    private boolean secure;

    public void addAccessTokenCookie(HttpServletResponse response, String token, long maxAgeSeconds) {
        addCookie(response, "access_token", token, "/", maxAgeSeconds);
    }

    public void addRefreshTokenCookie(HttpServletResponse response, String token, long maxAgeSeconds) {
        addCookie(response, "refresh_token", token, "/api/v1/auth/refresh", maxAgeSeconds);
    }

    public void clearAccessTokenCookie(HttpServletResponse response) {
        addCookie(response, "access_token", "", "/", 0);
    }

    public void clearRefreshTokenCookie(HttpServletResponse response) {
        addCookie(response, "refresh_token", "", "/api/v1/auth/refresh", 0);
    }

    private void addCookie(HttpServletResponse response, String name, String value,
                           String path, long maxAgeSeconds) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path(path)
                .maxAge(Duration.ofSeconds(maxAgeSeconds));

        if (!cookieDomain.isBlank()) {
            builder.domain(cookieDomain);
        }

        response.addHeader("Set-Cookie", builder.build().toString());
    }
}
