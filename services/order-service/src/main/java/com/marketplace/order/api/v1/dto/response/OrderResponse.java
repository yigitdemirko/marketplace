package com.marketplace.order.api.v1.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        String id,
        String userId,
        String status,
        BigDecimal totalAmount,
        String shippingAddress,
        String idempotencyKey,
        List<OrderItemResponse> items,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}