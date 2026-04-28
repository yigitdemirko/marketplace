package com.marketplace.payment.api.v1.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        String id,
        String orderId,
        String userId,
        BigDecimal amount,
        String status,
        String idempotencyKey,
        String iyzicoPaymentId,
        String failureReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}