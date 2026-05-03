package com.marketplace.user.application.service;

import com.marketplace.common.exception.ConflictException;
import com.marketplace.common.exception.NotFoundException;
import com.marketplace.user.api.v1.dto.request.BuyerRegisterRequest;
import com.marketplace.user.api.v1.dto.request.LoginRequest;
import com.marketplace.user.api.v1.dto.request.SellerRegisterRequest;
import com.marketplace.user.api.v1.dto.response.AuthResponse;
import com.marketplace.user.domain.exception.AuthenticationException;
import com.marketplace.user.domain.model.AccountType;
import com.marketplace.user.domain.model.BuyerProfile;
import com.marketplace.user.domain.model.SellerProfile;
import com.marketplace.user.domain.model.User;
import com.marketplace.user.domain.repository.BuyerProfileRepository;
import com.marketplace.user.domain.repository.SellerProfileRepository;
import com.marketplace.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BuyerProfileRepository buyerProfileRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

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
        return refreshTokenService.issueTokens(user, null, request.firstName(), request.lastName(), ip, userAgent);
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
        return refreshTokenService.issueTokens(user, profile.getStoreName(), null, null, ip, userAgent);
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
        ProfileData profile = loadProfile(user);
        AuthResult result = refreshTokenService.issueTokens(
                user, profile.storeName(), profile.firstName(), profile.lastName(), ip, userAgent);
        log.info("Login success: userId={}, type={}, ip={}", user.getId(), user.getAccountType(), ip);
        return result;
    }

    @Transactional
    public AuthResult refresh(String rawRefreshToken, String ip, String userAgent) {
        String userId = refreshTokenService.validateAndRotate(rawRefreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "Kullanıcı bulunamadı"));
        ProfileData profile = loadProfile(user);
        return refreshTokenService.issueTokens(
                user, profile.storeName(), profile.firstName(), profile.lastName(), ip, userAgent);
    }

    public void logout(String rawRefreshToken) {
        refreshTokenService.revoke(rawRefreshToken);
    }

    public void logoutAll(String userId) {
        refreshTokenService.revokeAllForUser(userId);
    }

    public AuthResponse toResponse(AuthResult result) {
        return new AuthResponse(result.userId(), result.email(), result.accountType(),
                result.storeName(), result.firstName(), result.lastName());
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

    private ProfileData loadProfile(User user) {
        if (user.getAccountType() == AccountType.SELLER) {
            String storeName = sellerProfileRepository.findByUserId(user.getId())
                    .map(SellerProfile::getStoreName)
                    .orElse(null);
            return new ProfileData(storeName, null, null);
        }
        if (user.getAccountType() == AccountType.BUYER) {
            return buyerProfileRepository.findByUserId(user.getId())
                    .map(p -> new ProfileData(null, p.getFirstName(), p.getLastName()))
                    .orElse(new ProfileData(null, null, null));
        }
        return new ProfileData(null, null, null);
    }

    private record ProfileData(String storeName, String firstName, String lastName) {}
}
