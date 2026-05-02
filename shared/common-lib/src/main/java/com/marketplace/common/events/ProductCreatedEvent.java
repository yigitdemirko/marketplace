package com.marketplace.common.events;

public record ProductCreatedEvent(
        String productId,
        String sellerId,
        int stock
) {}
