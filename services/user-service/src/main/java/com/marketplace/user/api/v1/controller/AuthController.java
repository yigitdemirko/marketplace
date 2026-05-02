package com.marketplace.user.api.v1.controller;

import com.marketplace.user.api.v1.dto.request.BuyerRegisterRequest;
import com.marketplace.user.api.v1.dto.request.LoginRequest;
import com.marketplace.user.api.v1.dto.request.SellerRegisterRequest;
import com.marketplace.user.api.v1.dto.response.AuthResponse;
import com.marketplace.user.application.service.AuthResult;
import com.marketplace.user.application.service.AuthService;
import com.marketplace.user.infrastructure.security.CookieUtil;
import com.marketplace.user.infrastructure.security.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth")
public class AuthController {

    private final AuthService authService;
    private final CookieUtil cookieUtil;
    private final JwtUtil jwtUtil;

    @PostMapping("/buyer/register")
    @Operation(summary = "Register buyer")
    public ResponseEntity<AuthResponse> registerBuyer(
            @Valid @RequestBody BuyerRegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        AuthResult result = authService.registerBuyer(request, getIp(httpRequest), getUserAgent(httpRequest));
        setAuthCookies(response, result);
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.toResponse(result));
    }

    @PostMapping("/seller/register")
    @Operation(summary = "Register seller")
    public ResponseEntity<AuthResponse> registerSeller(
            @Valid @RequestBody SellerRegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        AuthResult result = authService.registerSeller(request, getIp(httpRequest), getUserAgent(httpRequest));
        setAuthCookies(response, result);
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.toResponse(result));
    }

    @PostMapping("/login")
    @Operation(summary = "Login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        AuthResult result = authService.login(request, getIp(httpRequest), getUserAgent(httpRequest));
        setAuthCookies(response, result);
        return ResponseEntity.ok(authService.toResponse(result));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate refresh token and issue new access token")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest httpRequest, HttpServletResponse response) {
        String rawRefreshToken = extractCookie(httpRequest, "refresh_token");
        if (rawRefreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        AuthResult result = authService.refresh(rawRefreshToken, getIp(httpRequest), getUserAgent(httpRequest));
        setAuthCookies(response, result);
        return ResponseEntity.ok(authService.toResponse(result));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout current session")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest, HttpServletResponse response) {
        String rawRefreshToken = extractCookie(httpRequest, "refresh_token");
        authService.logout(rawRefreshToken);
        clearAuthCookies(response);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout-all")
    @Operation(summary = "Logout all sessions")
    public ResponseEntity<Void> logoutAll(HttpServletRequest httpRequest, HttpServletResponse response) {
        String accessToken = extractCookie(httpRequest, "access_token");
        if (accessToken != null && jwtUtil.isTokenValid(accessToken)) {
            authService.logoutAll(jwtUtil.extractUserId(accessToken));
        }
        clearAuthCookies(response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user info")
    public ResponseEntity<AuthResponse> me(HttpServletRequest httpRequest) {
        String accessToken = extractCookie(httpRequest, "access_token");
        if (accessToken == null || !jwtUtil.isTokenValid(accessToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String userId = jwtUtil.extractUserId(accessToken);
        String email = jwtUtil.extractEmail(accessToken);
        String accountType = jwtUtil.extractAccountType(accessToken);
        String storeName = null;
        if ("SELLER".equals(accountType)) {
            storeName = authService.getSellerStoreName(userId);
        }
        return ResponseEntity.ok(new AuthResponse(userId, email, accountType, storeName));
    }

    // -------------------------------------------------------------------------

    private void setAuthCookies(HttpServletResponse response, AuthResult result) {
        long accessSeconds = 900;          // 15 min
        long refreshSeconds = 604800;      // 7 days
        cookieUtil.addAccessTokenCookie(response, result.accessToken(), accessSeconds);
        cookieUtil.addRefreshTokenCookie(response, result.rawRefreshToken(), refreshSeconds);
    }

    private void clearAuthCookies(HttpServletResponse response) {
        cookieUtil.clearAccessTokenCookie(response);
        cookieUtil.clearRefreshTokenCookie(response);
    }

    private String extractCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    private String getIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return (forwarded != null) ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
    }

    private String getUserAgent(HttpServletRequest request) {
        return request.getHeader("User-Agent");
    }
}
