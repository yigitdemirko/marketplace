package com.marketplace.user.unit;

import com.marketplace.user.api.v1.dto.request.BuyerRegisterRequest;
import com.marketplace.user.api.v1.dto.request.LoginRequest;
import com.marketplace.user.application.service.AuthResult;
import com.marketplace.user.application.service.AuthService;
import com.marketplace.user.domain.model.AccountType;
import com.marketplace.user.domain.model.User;
import com.marketplace.user.domain.repository.BuyerProfileRepository;
import com.marketplace.user.domain.repository.RefreshTokenRepository;
import com.marketplace.user.domain.repository.SellerProfileRepository;
import com.marketplace.user.domain.repository.UserRepository;
import com.marketplace.user.infrastructure.redis.RefreshTokenRedisRepository;
import com.marketplace.user.infrastructure.security.JwtUtil;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BuyerProfileRepository buyerProfileRepository;

    @Mock
    private SellerProfileRepository sellerProfileRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private RefreshTokenRedisRepository refreshTokenRedisRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    @Test
    void should_RegisterBuyer_When_EmailNotExists() {
        BuyerRegisterRequest request = new BuyerRegisterRequest(
                "buyer@test.com", "password123", "Test", "Buyer"
        );

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(buyerProfileRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(jwtUtil.generateToken(anyString(), anyString(), any())).thenReturn("mockAccessToken");
        when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        AuthResult result = authService.registerBuyer(request, "127.0.0.1", "test-agent");

        assertThat(result.accessToken()).isEqualTo("mockAccessToken");
        assertThat(result.rawRefreshToken()).isNotNull();
        assertThat(result.email()).isEqualTo("buyer@test.com");
        assertThat(result.accountType()).isEqualTo("BUYER");
    }

    @Test
    void should_ThrowException_When_EmailAlreadyExists() {
        BuyerRegisterRequest request = new BuyerRegisterRequest(
                "buyer@test.com", "password123", "Test", "Buyer"
        );

        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.registerBuyer(request, "127.0.0.1", "test-agent"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Email already exists");
    }

    @Test
    void should_Login_When_CredentialsAreValid() {
        LoginRequest request = new LoginRequest("buyer@test.com", "password123");

        User mockUser = User.create("buyer@test.com", "encodedPassword", AccountType.BUYER);

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtUtil.generateToken(anyString(), anyString(), any())).thenReturn("mockAccessToken");
        when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        AuthResult result = authService.login(request, "127.0.0.1", "test-agent");

        assertThat(result.accessToken()).isEqualTo("mockAccessToken");
        assertThat(result.email()).isEqualTo("buyer@test.com");
    }

    @Test
    void should_ThrowException_When_PasswordIsWrong() {
        LoginRequest request = new LoginRequest("buyer@test.com", "wrongPassword");

        User mockUser = User.create("buyer@test.com", "encodedPassword", AccountType.BUYER);

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request, "127.0.0.1", "test-agent"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void should_ThrowException_When_UserNotFound() {
        LoginRequest request = new LoginRequest("notfound@test.com", "password123");

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request, "127.0.0.1", "test-agent"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Invalid email or password");
    }
}
