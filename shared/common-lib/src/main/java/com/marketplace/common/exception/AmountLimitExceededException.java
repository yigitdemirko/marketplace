package com.marketplace.common.exception;

import java.math.BigDecimal;

/**
 * Thrown when a monetary total (order, payment, basket, etc.) exceeds a configured maximum.
 *
 * <p>Mapped to HTTP 422 by each service's GlobalExceptionHandler, with `amount` and
 * `maxAmount` surfaced in the response body so the frontend can render a useful message.
 */
public class AmountLimitExceededException extends RuntimeException {

    private final BigDecimal amount;
    private final BigDecimal maxAmount;

    public AmountLimitExceededException(BigDecimal amount, BigDecimal maxAmount) {
        super("Amount " + amount + " exceeds the maximum allowed amount " + maxAmount);
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
