package com.marketplace.payment.application.service;

import java.math.BigDecimal;

public class PaymentAmountExceedsLimitException extends RuntimeException {

    private final BigDecimal amount;
    private final BigDecimal maxAmount;

    public PaymentAmountExceedsLimitException(BigDecimal amount, BigDecimal maxAmount) {
        super("Payment amount " + amount + " exceeds the maximum allowed amount " + maxAmount);
        this.amount = amount;
        this.maxAmount = maxAmount;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public BigDecimal getMaxAmount() {
        return maxAmount;
    }
}
