package com.marketplace.payment.api.v1.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ProcessPaymentRequest(
        @NotBlank String orderId,
        @NotBlank String userId,
        @NotNull BigDecimal amount,
        @NotBlank String idempotencyKey,
        @NotBlank String cardHolderName,
        @NotBlank String cardNumber,
        @NotBlank String expireMonth,
        @NotBlank String expireYear,
        @NotBlank String cvc
) {}