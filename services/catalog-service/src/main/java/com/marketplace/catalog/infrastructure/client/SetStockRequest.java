package com.marketplace.catalog.infrastructure.client;

public record SetStockRequest(String sellerId, Integer stock) {
}
