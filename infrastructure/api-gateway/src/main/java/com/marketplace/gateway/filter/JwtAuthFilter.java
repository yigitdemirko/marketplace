package com.marketplace.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret}")
    private String secret;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Strip injected identity headers from external requests
        ServerHttpRequest sanitized = exchange.getRequest().mutate()
                .headers(h -> {
                    h.remove("X-User-Id");
                    h.remove("X-User-Email");
                    h.remove("X-Account-Type");
                })
                .build();

        String token = extractAccessTokenCookie(sanitized);
        if (token == null) {
            return chain.filter(exchange.mutate().request(sanitized).build());
        }

        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            ServerHttpRequest enriched = sanitized.mutate()
                    .header("X-User-Id", claims.getSubject())
                    .header("X-User-Email", claims.get("email", String.class))
                    .header("X-Account-Type", claims.get("accountType", String.class))
                    .build();

            return chain.filter(exchange.mutate().request(enriched).build());
        } catch (Exception e) {
            // Invalid or expired token — pass through without identity headers
            return chain.filter(exchange.mutate().request(sanitized).build());
        }
    }

    @Override
    public int getOrder() {
        return -1;
    }

    private String extractAccessTokenCookie(ServerHttpRequest request) {
        var cookies = request.getCookies().get("access_token");
        if (cookies == null || cookies.isEmpty()) return null;
        return cookies.getFirst().getValue();
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
