package com.marketplace.order.api.v1.dto.response;

import java.math.BigDecimal;

public record OrderItemResponse(
        String id,
        String productId,
        String sellerId,
        Integer quantity,
        BigDecimal unitPrice
) {}