package com.marketplace.user.unit;

import com.marketplace.common.exception.ConflictException;
import com.marketplace.common.exception.NotFoundException;
import com.marketplace.user.api.v1.dto.request.BuyerRegisterRequest;
import com.marketplace.user.api.v1.dto.request.LoginRequest;
import com.marketplace.user.api.v1.dto.request.SellerRegisterRequest;
import com.marketplace.user.application.service.AuthResult;
import com.marketplace.user.application.service.AuthService;
import com.marketplace.user.application.service.RefreshTokenService;
import com.marketplace.user.domain.exception.AuthenticationException;
import com.marketplace.user.domain.model.AccountType;
import com.marketplace.user.domain.model.BuyerProfile;
import com.marketplace.user.domain.model.SellerProfile;
import com.marketplace.user.domain.model.User;
import com.marketplace.user.domain.repository.BuyerProfileRepository;
import com.marketplace.user.domain.repository.SellerProfileRepository;
import com.marketplace.user.domain.repository.UserRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private BuyerProfileRepository buyerProfileRepository;
    @Mock private SellerProfileRepository sellerProfileRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private RefreshTokenService refreshTokenService;

    @InjectMocks
    private AuthService authService;

    private static AuthResult fakeTokens(User user, String storeName, String firstName, String lastName) {
        return new AuthResult("access-token", "refresh-token", user.getId(),
                user.getEmail(), user.getAccountType().name(), storeName, firstName, lastName);
    }

    @Test
    void should_RegisterBuyer_When_EmailNotExists() {
        BuyerRegisterRequest request = new BuyerRegisterRequest(
                "buyer@test.com", "password123", "Test", "Buyer");
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(buyerProfileRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(refreshTokenService.issueTokens(any(), any(), eq("Test"), eq("Buyer"), anyString(), anyString()))
                .thenAnswer(i -> fakeTokens(i.getArgument(0), null, "Test", "Buyer"));

        AuthResult result = authService.registerBuyer(request, "127.0.0.1", "test-agent");

        assertThat(result.email()).isEqualTo("buyer@test.com");
        assertThat(result.accountType()).isEqualTo("BUYER");
        assertThat(result.firstName()).isEqualTo("Test");
        assertThat(result.lastName()).isEqualTo("Buyer");
        verify(refreshTokenService).issueTokens(any(), any(), eq("Test"), eq("Buyer"), anyString(), anyString());
    }

    @Test
    void should_ThrowException_When_EmailAlreadyExists() {
        BuyerRegisterRequest request = new BuyerRegisterRequest(
                "buyer@test.com", "password123", "Test", "Buyer");
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.registerBuyer(request, "127.0.0.1", "test-agent"))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Bu e-posta zaten kayıtlı");
        verify(refreshTokenService, never()).issueTokens(any(), any(), any(), any(), any(), any());
    }

    @Test
    void should_RegisterSeller_When_EmailNotExists() {
        SellerRegisterRequest request = new SellerRegisterRequest(
                "store@test.com", "password123", "TestStore", "1234567890", "+905551112233");
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(sellerProfileRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(refreshTokenService.issueTokens(any(), eq("TestStore"), any(), any(), anyString(), anyString()))
                .thenAnswer(i -> fakeTokens(i.getArgument(0), "TestStore", null, null));

        AuthResult result = authService.registerSeller(request, "1.1.1.1", "ua");

        assertThat(result.accountType()).isEqualTo("SELLER");
        assertThat(result.storeName()).isEqualTo("TestStore");
    }

    @Test
    void should_Login_When_CredentialsAreValid() {
        LoginRequest request = new LoginRequest("buyer@test.com", "password123");
        User user = User.create("buyer@test.com", "encodedPassword", AccountType.BUYER);
        BuyerProfile profile = BuyerProfile.create(user, "Demo", "Buyer");
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(buyerProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(profile));
        when(refreshTokenService.issueTokens(any(), any(), eq("Demo"), eq("Buyer"), anyString(), anyString()))
                .thenReturn(fakeTokens(user, null, "Demo", "Buyer"));

        AuthResult result = authService.login(request, "127.0.0.1", "test-agent");

        assertThat(result.accessToken()).isEqualTo("access-token");
        assertThat(result.email()).isEqualTo("buyer@test.com");
        assertThat(result.firstName()).isEqualTo("Demo");
    }

    @Test
    void should_ThrowException_When_PasswordIsWrong() {
        LoginRequest request = new LoginRequest("buyer@test.com", "wrong");
        User user = User.create("buyer@test.com", "encoded", AccountType.BUYER);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request, "127.0.0.1", "test-agent"))
                .isInstanceOf(AuthenticationException.class)
                .hasMessage("E-posta veya şifre hatalı");
        verify(refreshTokenService, never()).issueTokens(any(), any(), any(), any(), any(), any());
    }

    @Test
    void should_ThrowException_When_UserNotFound() {
        LoginRequest request = new LoginRequest("notfound@test.com", "password123");
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request, "127.0.0.1", "test-agent"))
                .isInstanceOf(AuthenticationException.class)
                .hasMessage("E-posta veya şifre hatalı");
    }

    @Test
    void should_RejectBuyerLogin_OnSellerLoginEndpoint() {
        LoginRequest request = new LoginRequest("buyer@test.com", "password");
        User buyer = User.create("buyer@test.com", "encoded", AccountType.BUYER);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(buyer));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.loginSeller(request, "ip", "ua"))
                .isInstanceOf(AuthenticationException.class)
                .hasMessage("E-posta veya şifre hatalı");
    }

    @Test
    void should_RejectSellerLogin_OnBuyerLoginEndpoint() {
        LoginRequest request = new LoginRequest("seller@test.com", "password");
        User seller = User.create("seller@test.com", "encoded", AccountType.SELLER);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(seller));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.loginBuyer(request, "ip", "ua"))
                .isInstanceOf(AuthenticationException.class)
                .hasMessage("E-posta veya şifre hatalı");
    }

    @Test
    void should_DelegateToRefreshTokenService_OnRefresh() {
        User user = User.create("buyer@test.com", "encoded", AccountType.BUYER);
        BuyerProfile profile = BuyerProfile.create(user, "Demo", "Buyer");
        when(refreshTokenService.validateAndRotate("raw")).thenReturn(user.getId());
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(buyerProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(profile));
        when(refreshTokenService.issueTokens(any(), any(), eq("Demo"), eq("Buyer"), anyString(), anyString()))
                .thenReturn(fakeTokens(user, null, "Demo", "Buyer"));

        AuthResult result = authService.refresh("raw", "ip", "ua");

        assertThat(result.firstName()).isEqualTo("Demo");
        verify(refreshTokenService).validateAndRotate("raw");
    }

    @Test
    void should_ThrowNotFound_When_RefreshUserDeleted() {
        when(refreshTokenService.validateAndRotate("raw")).thenReturn("ghost-id");
        when(userRepository.findById("ghost-id")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refresh("raw", "ip", "ua"))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Kullanıcı bulunamadı");
    }

    @Test
    void should_ResolveSellerStoreName_OnRefresh() {
        User seller = User.create("seller@test.com", "encoded", AccountType.SELLER);
        SellerProfile profile = SellerProfile.create(seller, "MyStore", "TX", "+90");
        when(refreshTokenService.validateAndRotate("raw")).thenReturn(seller.getId());
        when(userRepository.findById(seller.getId())).thenReturn(Optional.of(seller));
        when(sellerProfileRepository.findByUserId(seller.getId())).thenReturn(Optional.of(profile));
        when(refreshTokenService.issueTokens(any(), eq("MyStore"), any(), any(), anyString(), anyString()))
                .thenReturn(fakeTokens(seller, "MyStore", null, null));

        AuthResult result = authService.refresh("raw", "ip", "ua");

        assertThat(result.storeName()).isEqualTo("MyStore");
    }

    @Test
    void should_DelegateToRefreshTokenService_OnLogout() {
        authService.logout("raw-token");
        verify(refreshTokenService).revoke("raw-token");
    }

    @Test
    void should_DelegateToRefreshTokenService_OnLogoutAll() {
        authService.logoutAll("user-id");
        verify(refreshTokenService).revokeAllForUser("user-id");
    }
}
