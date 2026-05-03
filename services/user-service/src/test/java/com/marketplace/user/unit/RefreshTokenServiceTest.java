package com.marketplace.user.unit;

import com.marketplace.common.exception.UnauthorizedException;
import com.marketplace.user.application.service.AuthResult;
import com.marketplace.user.application.service.RefreshTokenService;
import com.marketplace.user.domain.model.AccountType;
import com.marketplace.user.domain.model.RefreshToken;
import com.marketplace.user.domain.model.User;
import com.marketplace.user.domain.repository.RefreshTokenRepository;
import com.marketplace.user.infrastructure.redis.RefreshTokenRedisRepository;
import com.marketplace.user.infrastructure.security.JwtUtil;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
class RefreshTokenServiceTest {

    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private RefreshTokenRedisRepository refreshTokenRedisRepository;
    @Mock private JwtUtil jwtUtil;

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    @Test
    void should_IssueAccessAndRefreshTokens() {
        User user = User.create("buyer@test.com", "encoded", AccountType.BUYER);
        when(jwtUtil.generateToken(anyString(), anyString(), any())).thenReturn("access-token");
        when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        AuthResult result = refreshTokenService.issueTokens(user, null, "Demo", "Buyer", "ip", "ua");

        assertThat(result.accessToken()).isEqualTo("access-token");
        assertThat(result.rawRefreshToken()).isNotBlank();
        verify(refreshTokenRedisRepository).store(anyString(), any(), any());
        verify(refreshTokenRepository).save(any());
    }

    @Test
    void should_RotateToken_When_RefreshTokenIsValid() {
        RefreshToken stored = new RefreshToken();
        stored.setUserId("user-1");
        stored.setRevoked(false);
        when(refreshTokenRedisRepository.getUserId(anyString())).thenReturn("user-1");
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(stored));
        when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        String userId = refreshTokenService.validateAndRotate("raw");

        assertThat(userId).isEqualTo("user-1");
        assertThat(stored.isRevoked()).isTrue();
        verify(refreshTokenRedisRepository).revoke(anyString());
    }

    @Test
    void should_RevokeAllSessions_When_RevokedTokenIsReplayed() {
        RefreshToken stored = new RefreshToken();
        stored.setUserId("victim-user");
        stored.setRevoked(true);
        when(refreshTokenRedisRepository.getUserId(anyString())).thenReturn(null);
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(stored));

        assertThatThrownBy(() -> refreshTokenService.validateAndRotate("stolen-old-token"))
                .isInstanceOf(UnauthorizedException.class);

        verify(refreshTokenRepository).revokeAllByUserId("victim-user");
        verify(refreshTokenRedisRepository).revokeAllForUser("victim-user");
    }

    @Test
    void should_RevokeAllSessions_When_LiveTokenInRedisButRevokedInDb() {
        RefreshToken stored = new RefreshToken();
        stored.setUserId("victim-user");
        stored.setRevoked(true);
        when(refreshTokenRedisRepository.getUserId(anyString())).thenReturn("victim-user");
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(stored));

        assertThatThrownBy(() -> refreshTokenService.validateAndRotate("weird-token"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Oturum zaten sonlandırılmış");

        verify(refreshTokenRepository).revokeAllByUserId("victim-user");
    }

    @Test
    void should_RejectRefresh_When_TokenNotInRedisAndNotInDb() {
        when(refreshTokenRedisRepository.getUserId(anyString())).thenReturn(null);
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> refreshTokenService.validateAndRotate("ghost"))
                .isInstanceOf(UnauthorizedException.class);

        verify(refreshTokenRepository, never()).revokeAllByUserId(anyString());
    }

    @Test
    void should_RevokeTokenInBothLayers_OnRevoke() {
        RefreshToken stored = new RefreshToken();
        stored.setRevoked(false);
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(stored));

        refreshTokenService.revoke("raw-token");

        verify(refreshTokenRedisRepository).revoke(anyString());
        assertThat(stored.isRevoked()).isTrue();
        verify(refreshTokenRepository).save(stored);
    }

    @Test
    void should_NoOp_OnRevokeWithBlankToken() {
        refreshTokenService.revoke("");
        verify(refreshTokenRedisRepository, never()).revoke(anyString());
    }

    @Test
    void should_RevokeAllSessions_OnRevokeAllForUser() {
        refreshTokenService.revokeAllForUser("user-1");

        verify(refreshTokenRepository).revokeAllByUserId("user-1");
        verify(refreshTokenRedisRepository).revokeAllForUser("user-1");
    }
}
