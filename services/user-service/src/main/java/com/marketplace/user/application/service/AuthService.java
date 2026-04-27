package com.marketplace.user.application.service;

import com.marketplace.user.api.v1.dto.request.BuyerRegisterRequest;
import com.marketplace.user.api.v1.dto.request.LoginRequest;
import com.marketplace.user.api.v1.dto.request.SellerRegisterRequest;
import com.marketplace.user.api.v1.dto.response.AuthResponse;
import com.marketplace.user.domain.model.AccountType;
import com.marketplace.user.domain.model.BuyerProfile;
import com.marketplace.user.domain.model.SellerProfile;
import com.marketplace.user.domain.model.User;
import com.marketplace.user.domain.repository.BuyerProfileRepository;
import com.marketplace.user.domain.repository.SellerProfileRepository;
import com.marketplace.user.domain.repository.UserRepository;
import com.marketplace.user.infrastructure.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BuyerProfileRepository buyerProfileRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse registerBuyer(BuyerRegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Bu e-posta adresi zaten kayıtlı");
        }

        User user = User.create(
                request.email(),
                passwordEncoder.encode(request.password()),
                AccountType.BUYER
        );
        userRepository.save(user);

        BuyerProfile profile = BuyerProfile.create(user, request.firstName(), request.lastName());
        buyerProfileRepository.save(profile);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getAccountType());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getAccountType().name());
    }

    @Transactional
    public AuthResponse registerSeller(SellerRegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Bu e-posta adresi zaten kayıtlı");
        }

        User user = User.create(
                request.email(),
                passwordEncoder.encode(request.password()),
                AccountType.SELLER
        );
        userRepository.save(user);

        SellerProfile profile = SellerProfile.create(
                user,
                request.storeName(),
                request.taxNumber(),
                request.phone()
        );
        sellerProfileRepository.save(profile);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getAccountType());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getAccountType().name());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("E-posta veya şifre hatalı"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new RuntimeException("E-posta veya şifre hatalı");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getAccountType());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getAccountType().name());
    }
}