package com.marketplace.user.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
public class RefreshToken {

    @Id
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private String sessionId;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean revoked = false;

    @Column(length = 45)
    private String ip;

    @Column(length = 512)
    private String userAgent;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    public static RefreshToken create(String userId, String tokenHash, String sessionId,
                                      LocalDateTime expiresAt, String ip, String userAgent) {
        RefreshToken token = new RefreshToken();
        token.id = UUID.randomUUID().toString();
        token.userId = userId;
        token.tokenHash = tokenHash;
        token.sessionId = sessionId;
        token.expiresAt = expiresAt;
        token.ip = ip;
        token.userAgent = userAgent;
        token.createdAt = LocalDateTime.now();
        return token;
    }
}
