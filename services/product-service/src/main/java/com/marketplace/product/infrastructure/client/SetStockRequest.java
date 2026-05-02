package com.marketplace.product.infrastructure.client;

public record SetStockRequest(String sellerId, Integer stock) {
}
