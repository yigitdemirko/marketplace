package com.marketplace.common.events;

public record StockReservationExpiredEvent(
        String orderId,
        String reason
) {}
