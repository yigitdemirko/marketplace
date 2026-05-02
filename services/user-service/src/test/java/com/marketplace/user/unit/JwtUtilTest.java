package com.marketplace.user.unit;

import com.marketplace.user.domain.model.AccountType;
import com.marketplace.user.infrastructure.security.JwtUtil;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Tag("unit")
class JwtUtilTest {

    private JwtUtil jwt;

    @BeforeEach
    void setUp() {
        jwt = new JwtUtil();
        ReflectionTestUtils.setField(jwt, "secret", "test-secret-must-be-at-least-32-chars-long-xyz");
        ReflectionTestUtils.setField(jwt, "expiration", 900_000L);
    }

    @Test
    void should_RoundTripUserIdEmailAndAccountType() {
        String token = jwt.generateToken("user-1", "user@test.com", AccountType.BUYER);

        Claims claims = jwt.extractClaims(token);
        assertThat(claims.getSubject()).isEqualTo("user-1");
        assertThat(jwt.extractUserId(token)).isEqualTo("user-1");
        assertThat(jwt.extractEmail(token)).isEqualTo("user@test.com");
        assertThat(jwt.extractAccountType(token)).isEqualTo("BUYER");
        assertThat(jwt.isTokenValid(token)).isTrue();
    }

    @Test
    void should_ProduceDistinctTokens_PerAccountType() {
        String buyerToken = jwt.generateToken("u1", "x@test.com", AccountType.BUYER);
        String sellerToken = jwt.generateToken("u1", "x@test.com", AccountType.SELLER);

        assertThat(jwt.extractAccountType(buyerToken)).isEqualTo("BUYER");
        assertThat(jwt.extractAccountType(sellerToken)).isEqualTo("SELLER");
    }

    @Test
    void should_RejectTamperedToken() {
        String valid = jwt.generateToken("u1", "x@test.com", AccountType.BUYER);
        String tampered = valid.substring(0, valid.length() - 4) + "AAAA";

        assertThat(jwt.isTokenValid(tampered)).isFalse();
        assertThatThrownBy(() -> jwt.extractClaims(tampered))
                .isInstanceOf(Exception.class);
    }

    @Test
    void should_RejectMalformedToken() {
        assertThat(jwt.isTokenValid("not-a-jwt")).isFalse();
        assertThat(jwt.isTokenValid("")).isFalse();
    }

    @Test
    void should_RejectExpiredToken() throws Exception {
        ReflectionTestUtils.setField(jwt, "expiration", 1L);
        String expired = jwt.generateToken("u1", "x@test.com", AccountType.BUYER);
        Thread.sleep(10);

        assertThat(jwt.isTokenValid(expired)).isFalse();
    }

    @Test
    void should_RejectTokenSignedWithDifferentSecret() {
        String token = jwt.generateToken("u1", "x@test.com", AccountType.BUYER);

        JwtUtil otherJwt = new JwtUtil();
        ReflectionTestUtils.setField(otherJwt, "secret", "another-secret-32-chars-long-aaaaaaaaaaaa");
        ReflectionTestUtils.setField(otherJwt, "expiration", 900_000L);

        assertThat(otherJwt.isTokenValid(token)).isFalse();
    }
}
