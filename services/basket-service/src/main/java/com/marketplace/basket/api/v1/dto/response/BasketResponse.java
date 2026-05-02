package com.marketplace.basket.api.v1.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record BasketResponse(
        String userId,
        List<BasketItemResponse> items,
        int totalItems,
        BigDecimal totalAmount,
        boolean hydrated,
        Instant updatedAt
) {}
