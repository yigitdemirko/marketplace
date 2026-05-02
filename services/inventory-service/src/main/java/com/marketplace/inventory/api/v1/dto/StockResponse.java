package com.marketplace.inventory.api.v1.dto;

public record StockResponse(String productId, String sellerId, Integer stock) {
}
