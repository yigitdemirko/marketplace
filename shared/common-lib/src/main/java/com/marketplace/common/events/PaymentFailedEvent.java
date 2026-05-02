package com.marketplace.common.events;

public record PaymentFailedEvent(
        String paymentId,
        String orderId,
        String userId,
        String reason
) {}
