package com.marketplace.common.events;

import java.math.BigDecimal;
import java.util.List;

public record OrderCreatedEvent(
        String orderId,
        String userId,
        List<Item> items,
        BigDecimal totalAmount
) {
    public record Item(
            String productId,
            String sellerId,
            int quantity,
            BigDecimal unitPrice
    ) {}
}
