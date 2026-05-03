package com.marketplace.user.application.service;

import com.marketplace.common.exception.ConflictException;
import com.marketplace.common.exception.NotFoundException;
import com.marketplace.common.exception.UnauthorizedException;
import com.marketplace.user.api.v1.dto.request.BuyerRegisterRequest;
import com.marketplace.user.domain.exception.AuthenticationException;
import com.marketplace.user.api.v1.dto.request.LoginRequest;
import com.marketplace.user.api.v1.dto.request.SellerRegisterRequest;
import com.marketplace.user.api.v1.dto.response.AuthResponse;
import com.marketplace.user.domain.model.AccountType;
import com.marketplace.user.domain.model.BuyerProfile;
import com.marketplace.user.domain.model.RefreshToken;
import com.marketplace.user.domain.model.SellerProfile;
import com.marketplace.user.domain.model.User;
import com.marketplace.user.domain.repository.BuyerProfileRepository;
import com.marketplace.user.domain.repository.RefreshTokenRepository;
import com.marketplace.user.domain.repository.SellerProfileRepository;
import com.marketplace.user.domain.repository.UserRepository;
import com.marketplace.user.infrastructure.redis.RefreshTokenRedisRepository;
import com.marketplace.user.infrastructure.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BuyerProfileRepository buyerProfileRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenRedisRepository refreshTokenRedisRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Value("${jwt.expiration:900000}")
    private long accessTokenExpirationMs;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshTokenExpirationMs;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public AuthResult registerBuyer(BuyerRegisterRequest request, String ip, String userAgent) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("EMAIL_ALREADY_EXISTS", "Bu e-posta zaten kayıtlı");
        }
        User user = User.create(request.email(), passwordEncoder.encode(request.password()), AccountType.BUYER);
        userRepository.save(user);
        BuyerProfile profile = BuyerProfile.create(user, request.firstName(), request.lastName());
        buyerProfileRepository.save(profile);
        log.info("Buyer registered: userId={}, ip={}", user.getId(), ip);
        return issueTokens(user, null, request.firstName(), request.lastName(), ip, userAgent);
    }

    @Transactional
    public AuthResult registerSeller(SellerRegisterRequest request, String ip, String userAgent) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("EMAIL_ALREADY_EXISTS", "Bu e-posta zaten kayıtlı");
        }
        User user = User.create(request.email(), passwordEncoder.encode(request.password()), AccountType.SELLER);
        userRepository.save(user);
        SellerProfile profile = SellerProfile.create(user, request.storeName(), request.taxNumber(), request.phone());
        sellerProfileRepository.save(profile);
        log.info("Seller registered: userId={}, storeName={}, ip={}", user.getId(), profile.getStoreName(), ip);
        return issueTokens(user, profile.getStoreName(), null, null, ip, userAgent);
    }

    public AuthResult login(LoginRequest request, String ip, String userAgent) {
        return loginInternal(request, null, ip, userAgent);
    }

    public AuthResult loginBuyer(LoginRequest request, String ip, String userAgent) {
        return loginInternal(request, AccountType.BUYER, ip, userAgent);
    }

    public AuthResult loginSeller(LoginRequest request, String ip, String userAgent) {
        return loginInternal(request, AccountType.SELLER, ip, userAgent);
    }

    private AuthResult loginInternal(LoginRequest request, AccountType expectedType, String ip, String userAgent) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new AuthenticationException("E-posta veya şifre hatalı"));
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            log.warn("Login failed: email={}, ip={}", request.email(), ip);
            throw new AuthenticationException("E-posta veya şifre hatalı");
        }
        if (expectedType != null && user.getAccountType() != expectedType) {
            log.warn("Login type mismatch: email={}, ip={}", request.email(), ip);
            throw new AuthenticationException("E-posta veya şifre hatalı");
        }
        String storeName = null;
        String firstName = null;
        String lastName = null;
        if (user.getAccountType() == AccountType.SELLER) {
            storeName = sellerProfileRepository.findByUserId(user.getId())
                    .map(SellerProfile::getStoreName)
                    .orElse(null);
        } else if (user.getAccountType() == AccountType.BUYER) {
            BuyerProfile profile = buyerProfileRepository.findByUserId(user.getId()).orElse(null);
            if (profile != null) {
                firstName = profile.getFirstName();
                lastName = profile.getLastName();
            }
        }
        AuthResult result = issueTokens(user, storeName, firstName, lastName, ip, userAgent);
        log.info("Login success: userId={}, type={}, ip={}", user.getId(), user.getAccountType(), ip);
        return result;
    }

    @Transactional
    public AuthResult refresh(String rawRefreshToken, String ip, String userAgent) {
        String tokenHash = hash(rawRefreshToken);
        String userId = refreshTokenRedisRepository.getUserId(tokenHash);

        if (userId == null) {
            // Not in Redis — either expired or revoked
            // Check DB to detect replay attack
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(stored -> {
                if (stored.isRevoked()) {
                    log.warn("Replay attack detected for user {}: revoking all sessions", stored.getUserId());
                    revokeAllSessions(stored.getUserId());
                }
            });
            throw new UnauthorizedException("INVALID_REFRESH_TOKEN", "Geçersiz veya süresi dolmuş oturum");
        }

        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("REFRESH_TOKEN_NOT_FOUND", "Oturum bulunamadı"));

        if (stored.isRevoked()) {
            log.warn("Replay attack detected for user {}: revoking all sessions", userId);
            revokeAllSessions(userId);
            throw new UnauthorizedException("REFRESH_TOKEN_REVOKED", "Oturum zaten sonlandırılmış");
        }

        // Rotate: revoke old token
        refreshTokenRedisRepository.revoke(tokenHash);
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        // Issue new pair
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "Kullanıcı bulunamadı"));
        String storeName = null;
        String firstName = null;
        String lastName = null;
        if (user.getAccountType() == AccountType.SELLER) {
            storeName = sellerProfileRepository.findByUserId(userId)
                    .map(SellerProfile::getStoreName)
                    .orElse(null);
        } else if (user.getAccountType() == AccountType.BUYER) {
            BuyerProfile profile = buyerProfileRepository.findByUserId(userId).orElse(null);
            if (profile != null) {
                firstName = profile.getFirstName();
                lastName = profile.getLastName();
            }
        }
        return issueTokens(user, storeName, firstName, lastName, ip, userAgent);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) return;
        String tokenHash = hash(rawRefreshToken);
        refreshTokenRedisRepository.revoke(tokenHash);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(t -> {
            t.setRevoked(true);
            refreshTokenRepository.save(t);
        });
    }

    @Transactional
    public void logoutAll(String userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
        refreshTokenRedisRepository.revokeAllForUser(userId);
    }

    public AuthResponse toResponse(AuthResult result) {
        return new AuthResponse(result.userId(), result.email(), result.accountType(), result.storeName(), result.firstName(), result.lastName());
    }

    public String getSellerStoreName(String userId) {
        return sellerProfileRepository.findByUserId(userId)
                .map(SellerProfile::getStoreName)
                .orElse(null);
    }

    public String[] getBuyerName(String userId) {
        return buyerProfileRepository.findByUserId(userId)
                .map(p -> new String[]{p.getFirstName(), p.getLastName()})
                .orElse(new String[]{null, null});
    }

    // -------------------------------------------------------------------------

    private AuthResult issueTokens(User user, String storeName, String firstName, String lastName, String ip, String userAgent) {
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

    private void revokeAllSessions(String userId) {
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
