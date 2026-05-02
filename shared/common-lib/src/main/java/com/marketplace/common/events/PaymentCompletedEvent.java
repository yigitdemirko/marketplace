package com.marketplace.common.events;

import java.math.BigDecimal;

public record PaymentCompletedEvent(
        String paymentId,
        String orderId,
        String userId,
        BigDecimal amount
) {}
