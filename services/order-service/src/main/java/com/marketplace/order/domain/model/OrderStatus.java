package com.marketplace.order.domain.model;

public enum OrderStatus {
    PENDING,
    STOCK_RESERVING,
    PAYMENT_PENDING,
    CONFIRMED,
    DELIVERED,
    CANCELLED
}