package com.marketplace.user.unit;

import com.marketplace.user.api.v1.dto.request.BuyerRegisterRequest;
import com.marketplace.user.api.v1.dto.request.LoginRequest;
import com.marketplace.user.api.v1.dto.response.AuthResponse;
import com.marketplace.user.application.service.AuthService;
import com.marketplace.user.domain.model.AccountType;
import com.marketplace.user.domain.model.BuyerProfile;
import com.marketplace.user.domain.model.User;
import com.marketplace.user.domain.repository.BuyerProfileRepository;
import com.marketplace.user.domain.repository.UserRepository;
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
    private com.marketplace.user.domain.repository.SellerProfileRepository sellerProfileRepository;

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
        when(jwtUtil.generateToken(anyString(), anyString(), any())).thenReturn("mockToken");

        AuthResponse response = authService.registerBuyer(request);

        assertThat(response.token()).isEqualTo("mockToken");
        assertThat(response.email()).isEqualTo("buyer@test.com");
        assertThat(response.accountType()).isEqualTo("BUYER");
    }

    @Test
    void should_ThrowException_When_EmailAlreadyExists() {
        BuyerRegisterRequest request = new BuyerRegisterRequest(
                "buyer@test.com", "password123", "Test", "Buyer"
        );

        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.registerBuyer(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Email already exists");
    }

    @Test
    void should_Login_When_CredentialsAreValid() {
        LoginRequest request = new LoginRequest("buyer@test.com", "password123");

        User mockUser = User.create("buyer@test.com", "encodedPassword", AccountType.BUYER);

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtUtil.generateToken(anyString(), anyString(), any())).thenReturn("mockToken");

        AuthResponse response = authService.login(request);

        assertThat(response.token()).isEqualTo("mockToken");
        assertThat(response.email()).isEqualTo("buyer@test.com");
    }

    @Test
    void should_ThrowException_When_PasswordIsWrong() {
        LoginRequest request = new LoginRequest("buyer@test.com", "wrongPassword");

        User mockUser = User.create("buyer@test.com", "encodedPassword", AccountType.BUYER);

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void should_ThrowException_When_UserNotFound() {
        LoginRequest request = new LoginRequest("notfound@test.com", "password123");

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Invalid email or password");
    }
}