package com.marketplace.user.application.service;

public record AuthResult(
        String accessToken,
        String rawRefreshToken,
        String userId,
        String email,
        String accountType,
        String storeName,
        String firstName,
        String lastName
) {}
