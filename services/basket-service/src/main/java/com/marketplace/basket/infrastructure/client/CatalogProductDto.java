package com.marketplace.basket.infrastructure.client;

import java.math.BigDecimal;

public record CatalogProductDto(
        String productId,
        boolean valid,
        String sellerId,
        BigDecimal currentPrice,
        Integer availableStock,
        String reason,
        String name,
        String imageUrl,
        String brand
) {}
