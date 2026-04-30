package com.marketplace.order.infrastructure.client;

import java.math.BigDecimal;

public record ValidatedProduct(
        String productId,
        boolean valid,
        String sellerId,
        BigDecimal currentPrice,
        Integer availableStock,
        String reason
) {}
