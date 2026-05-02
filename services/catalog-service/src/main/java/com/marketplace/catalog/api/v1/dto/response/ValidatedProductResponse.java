package com.marketplace.catalog.api.v1.dto.response;

import java.math.BigDecimal;

public record ValidatedProductResponse(
        String productId,
        boolean valid,
        String sellerId,
        BigDecimal currentPrice,
        Integer availableStock,
        String reason
) {}
