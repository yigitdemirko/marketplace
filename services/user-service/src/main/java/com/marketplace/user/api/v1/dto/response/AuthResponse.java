package com.marketplace.user.api.v1.dto.response;

public record AuthResponse(
        String userId,
        String email,
        String accountType,
        String storeName,
        String firstName,
        String lastName
) {}
