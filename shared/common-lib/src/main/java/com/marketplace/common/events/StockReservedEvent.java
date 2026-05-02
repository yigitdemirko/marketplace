package com.marketplace.common.events;

public record StockReservedEvent(
        String orderId,
        String userId
) {}
