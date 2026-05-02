package com.marketplace.common.events;

public record OrderCancelledEvent(
        String orderId,
        String userId
) {}
