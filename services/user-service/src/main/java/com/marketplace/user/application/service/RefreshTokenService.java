package com.marketplace.user.application.service;

import com.marketplace.common.exception.UnauthorizedException;
import com.marketplace.user.domain.model.RefreshToken;
import com.marketplace.user.domain.model.User;
import com.marketplace.user.domain.repository.RefreshTokenRepository;
import com.marketplace.user.infrastructure.redis.RefreshTokenRedisRepository;
import com.marketplace.user.infrastructure.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Owns the refresh-token lifecycle: issue, rotate, revoke. Holds the only access path to
 * RefreshTokenRepository / RefreshTokenRedisRepository so token state changes happen in one
 * place. AuthService composes register/login flows on top.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenRedisRepository refreshTokenRedisRepository;
    private final JwtUtil jwtUtil;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshTokenExpirationMs;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public AuthResult issueTokens(User user, String storeName, String firstName, String lastName,
                                  String ip, String userAgent) {
        String accessToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getAccountType());
        String rawRefreshToken = generateRawToken();
        String tokenHash = hash(rawRefreshToken);
        String sessionId = UUID.randomUUID().toString();
        long refreshSeconds = refreshTokenExpirationMs / 1000;

        refreshTokenRedisRepository.store(tokenHash, user.getId(), Duration.ofMillis(refreshTokenExpirationMs));

        RefreshToken entity = RefreshToken.create(
                user.getId(), tokenHash, sessionId,
                LocalDateTime.now().plusSeconds(refreshSeconds), ip, userAgent);
        refreshTokenRepository.save(entity);

        return new AuthResult(accessToken, rawRefreshToken, user.getId(),
                user.getEmail(), user.getAccountType().name(), storeName, firstName, lastName);
    }

    /**
     * Validate a raw refresh token and rotate it (mark current as revoked, drop from Redis).
     * Returns the userId that owns the token. On replay (revoked-but-presented) all of that
     * user's sessions are revoked.
     */
    @Transactional
    public String validateAndRotate(String rawRefreshToken) {
        String tokenHash = hash(rawRefreshToken);
        String userId = refreshTokenRedisRepository.getUserId(tokenHash);

        if (userId == null) {
            // Not in Redis — either expired or revoked. Check DB to detect replay.
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(stored -> {
                if (stored.isRevoked()) {
                    log.warn("Replay attack detected for user {}: revoking all sessions", stored.getUserId());
                    revokeAllForUser(stored.getUserId());
                }
            });
            throw new UnauthorizedException("INVALID_REFRESH_TOKEN", "Geçersiz veya süresi dolmuş oturum");
        }

        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("REFRESH_TOKEN_NOT_FOUND", "Oturum bulunamadı"));

        if (stored.isRevoked()) {
            log.warn("Replay attack detected for user {}: revoking all sessions", userId);
            revokeAllForUser(userId);
            throw new UnauthorizedException("REFRESH_TOKEN_REVOKED", "Oturum zaten sonlandırılmış");
        }

        refreshTokenRedisRepository.revoke(tokenHash);
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        return userId;
    }

    @Transactional
    public void revoke(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) return;
        String tokenHash = hash(rawRefreshToken);
        refreshTokenRedisRepository.revoke(tokenHash);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(t -> {
            t.setRevoked(true);
            refreshTokenRepository.save(t);
        });
    }

    @Transactional
    public void revokeAllForUser(String userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
        refreshTokenRedisRepository.revokeAllForUser(userId);
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(raw.getBytes());
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
