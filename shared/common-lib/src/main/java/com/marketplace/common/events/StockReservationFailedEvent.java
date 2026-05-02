package com.marketplace.common.events;

public record StockReservationFailedEvent(
        String orderId,
        String reason
) {}
