package com.marketplace.basket.api.v1.dto.response;

import java.math.BigDecimal;

public record BasketItemResponse(
        String productId,
        int quantity,
        String name,
        String imageUrl,
        String brand,
        String sellerId,
        BigDecimal currentPrice,
        BigDecimal lineTotal,
        Integer availableStock,
        boolean available,
        String unavailableReason
) {}
