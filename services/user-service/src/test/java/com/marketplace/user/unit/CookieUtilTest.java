package com.marketplace.user.unit;

import com.marketplace.user.infrastructure.security.CookieUtil;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

@Tag("unit")
class CookieUtilTest {

    private CookieUtil util;
    private HttpServletResponse response;

    @BeforeEach
    void setUp() {
        util = new CookieUtil();
        ReflectionTestUtils.setField(util, "cookieDomain", "");
        ReflectionTestUtils.setField(util, "secure", true);
        response = mock(HttpServletResponse.class);
    }

    @Test
    void should_BuildAccessTokenCookie_WithRootPathAndSecureFlags() {
        util.addAccessTokenCookie(response, "jwt-value", 900);

        String cookie = captureCookie();
        assertThat(cookie).contains("access_token=jwt-value");
        assertThat(cookie).contains("Path=/");
        assertThat(cookie).contains("HttpOnly");
        assertThat(cookie).contains("Secure");
        assertThat(cookie).contains("SameSite=Lax");
        assertThat(cookie).contains("Max-Age=900");
    }

    @Test
    void should_RestrictRefreshTokenCookie_ToRefreshEndpointPath() {
        util.addRefreshTokenCookie(response, "refresh-value", 604800);

        String cookie = captureCookie();
        assertThat(cookie).contains("refresh_token=refresh-value");
        assertThat(cookie).contains("Path=/api/v1/auth/refresh");
        assertThat(cookie).contains("HttpOnly");
    }

    @Test
    void should_OmitDomain_When_CookieDomainPropertyBlank() {
        util.addAccessTokenCookie(response, "jwt", 900);
        assertThat(captureCookie()).doesNotContain("Domain=");
    }

    @Test
    void should_IncludeDomain_When_CookieDomainPropertySet() {
        ReflectionTestUtils.setField(util, "cookieDomain", ".bilbos-shop.com");

        util.addAccessTokenCookie(response, "jwt", 900);

        assertThat(captureCookie()).contains("Domain=.bilbos-shop.com");
    }

    @Test
    void should_OmitSecureFlag_When_SecurePropertyFalse() {
        ReflectionTestUtils.setField(util, "secure", false);

        util.addAccessTokenCookie(response, "jwt", 900);

        assertThat(captureCookie()).doesNotContain("Secure");
    }

    @Test
    void should_ClearAccessTokenCookie_WithMaxAgeZero() {
        util.clearAccessTokenCookie(response);

        String cookie = captureCookie();
        assertThat(cookie).contains("access_token=");
        assertThat(cookie).contains("Max-Age=0");
    }

    @Test
    void should_ClearRefreshTokenCookie_WithMaxAgeZeroAndScopedPath() {
        util.clearRefreshTokenCookie(response);

        String cookie = captureCookie();
        assertThat(cookie).contains("refresh_token=");
        assertThat(cookie).contains("Path=/api/v1/auth/refresh");
        assertThat(cookie).contains("Max-Age=0");
    }

    private String captureCookie() {
        ArgumentCaptor<String> name = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> value = ArgumentCaptor.forClass(String.class);
        verify(response).addHeader(name.capture(), value.capture());
        assertThat(name.getValue()).isEqualTo("Set-Cookie");
        return value.getValue();
    }
}
