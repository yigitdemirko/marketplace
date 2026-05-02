package com.marketplace.user.unit;

import com.marketplace.user.api.v1.dto.request.BuyerRegisterRequest;
import com.marketplace.user.api.v1.dto.request.LoginRequest;
import com.marketplace.user.api.v1.dto.request.SellerRegisterRequest;
import com.marketplace.user.application.service.AuthResult;
import com.marketplace.user.application.service.AuthService;
import com.marketplace.user.domain.exception.AuthenticationException;
import com.marketplace.user.domain.model.AccountType;
import com.marketplace.user.domain.model.RefreshToken;
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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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

    @Test
    void should_RegisterSeller_When_EmailNotExists() {
        SellerRegisterRequest request = new SellerRegisterRequest(
                "store@test.com", "password123", "TestStore", "1234567890", "+905551112233"
        );

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(sellerProfileRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(jwtUtil.generateToken(anyString(), anyString(), any())).thenReturn("token");
        when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        AuthResult result = authService.registerSeller(request, "1.1.1.1", "ua");

        assertThat(result.accountType()).isEqualTo("SELLER");
        assertThat(result.storeName()).isEqualTo("TestStore");
    }

    @Test
    void should_RejectBuyerLogin_OnSellerLoginEndpoint() {
        LoginRequest request = new LoginRequest("buyer@test.com", "password");
        User buyer = User.create("buyer@test.com", "encoded", AccountType.BUYER);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(buyer));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.loginSeller(request, "ip", "ua"))
                .isInstanceOf(AuthenticationException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void should_RejectSellerLogin_OnBuyerLoginEndpoint() {
        LoginRequest request = new LoginRequest("seller@test.com", "password");
        User seller = User.create("seller@test.com", "encoded", AccountType.SELLER);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(seller));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.loginBuyer(request, "ip", "ua"))
                .isInstanceOf(AuthenticationException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void should_RotateToken_When_RefreshTokenIsValid() {
        String rawToken = "raw-refresh-abc";
        User user = User.create("buyer@test.com", "encoded", AccountType.BUYER);
        RefreshToken stored = new RefreshToken();
        stored.setUserId(user.getId());
        stored.setRevoked(false);

        when(refreshTokenRedisRepository.getUserId(anyString())).thenReturn(user.getId());
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(stored));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(anyString(), anyString(), any())).thenReturn("new-access");
        when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        AuthResult result = authService.refresh(rawToken, "ip", "ua");

        assertThat(result.accessToken()).isEqualTo("new-access");
        assertThat(result.rawRefreshToken()).isNotEqualTo(rawToken);
        assertThat(stored.isRevoked()).isTrue();
        verify(refreshTokenRedisRepository).revoke(anyString());
    }

    @Test
    void should_RevokeAllSessions_When_RevokedTokenIsReplayed() {
        String rawToken = "stolen-old-token";
        RefreshToken stored = new RefreshToken();
        stored.setUserId("victim-user");
        stored.setRevoked(true);

        when(refreshTokenRedisRepository.getUserId(anyString())).thenReturn(null);
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(stored));

        assertThatThrownBy(() -> authService.refresh(rawToken, "attacker-ip", "attacker-ua"))
                .isInstanceOf(RuntimeException.class);

        verify(refreshTokenRepository).revokeAllByUserId("victim-user");
        verify(refreshTokenRedisRepository).revokeAllForUser("victim-user");
    }

    @Test
    void should_RevokeAllSessions_When_LiveTokenInRedisButRevokedInDb() {
        String rawToken = "weird-token";
        RefreshToken stored = new RefreshToken();
        stored.setUserId("victim-user");
        stored.setRevoked(true);

        when(refreshTokenRedisRepository.getUserId(anyString())).thenReturn("victim-user");
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(stored));

        assertThatThrownBy(() -> authService.refresh(rawToken, "ip", "ua"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Refresh token already revoked");

        verify(refreshTokenRepository).revokeAllByUserId("victim-user");
    }

    @Test
    void should_RejectRefresh_When_TokenNotInRedisAndNotInDb() {
        when(refreshTokenRedisRepository.getUserId(anyString())).thenReturn(null);
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refresh("ghost", "ip", "ua"))
                .isInstanceOf(RuntimeException.class);

        verify(refreshTokenRepository, never()).revokeAllByUserId(anyString());
    }

    @Test
    void should_RevokeTokenInBothLayers_OnLogout() {
        RefreshToken stored = new RefreshToken();
        stored.setRevoked(false);
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(stored));

        authService.logout("raw-token");

        verify(refreshTokenRedisRepository).revoke(anyString());
        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        assertThat(captor.getValue().isRevoked()).isTrue();
    }

    @Test
    void should_NoOp_OnLogoutWithBlankToken() {
        authService.logout(null);
        authService.logout("");
        authService.logout("   ");

        verify(refreshTokenRedisRepository, never()).revoke(anyString());
    }

    @Test
    void should_RevokeAllSessions_OnLogoutAll() {
        authService.logoutAll("u1");

        verify(refreshTokenRepository).revokeAllByUserId("u1");
        verify(refreshTokenRedisRepository).revokeAllForUser("u1");
    }
}
