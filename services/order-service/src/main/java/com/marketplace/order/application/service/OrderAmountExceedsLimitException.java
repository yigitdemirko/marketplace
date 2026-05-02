package com.marketplace.order.application.service;

import java.math.BigDecimal;

public class OrderAmountExceedsLimitException extends RuntimeException {

    private final BigDecimal totalAmount;
    private final BigDecimal maxAmount;

    public OrderAmountExceedsLimitException(BigDecimal totalAmount, BigDecimal maxAmount) {
        super("Order total " + totalAmount + " exceeds the maximum allowed amount " + maxAmount);
        this.totalAmount = totalAmount;
        this.maxAmount = maxAmount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public BigDecimal getMaxAmount() {
        return maxAmount;
    }
}
