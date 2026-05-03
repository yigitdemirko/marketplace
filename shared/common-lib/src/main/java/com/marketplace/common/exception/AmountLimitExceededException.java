package com.marketplace.common.exception;

import java.math.BigDecimal;

/**
 * Thrown when a monetary total (order, payment, basket, etc.) exceeds a configured maximum.
 *
 * <p>Mapped to HTTP 422 with `amount` and `maxAmount` surfaced in the response body so the
 * frontend can render a useful message. Each service may map its own service-specific code
 * via an explicit @ExceptionHandler that takes precedence over the generic BusinessException
 * handler.
 */
public class AmountLimitExceededException extends BusinessException {

    private final BigDecimal amount;
    private final BigDecimal maxAmount;

    public AmountLimitExceededException(BigDecimal amount, BigDecimal maxAmount) {
        super(422, "AMOUNT_LIMIT_EXCEEDED",
                "Amount " + amount + " exceeds the maximum allowed amount " + maxAmount);
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
