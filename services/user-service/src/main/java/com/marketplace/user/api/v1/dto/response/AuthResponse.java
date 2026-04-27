package com.marketplace.user.api.v1.dto.response;

public record AuthResponse(
        String token,
        String userId,
        String email,
        String accountType
) {}