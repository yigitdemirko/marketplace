package com.marketplace.common.events;

public record StockChangedEvent(
        String productId,
        String sellerId,
        int stock
) {}
