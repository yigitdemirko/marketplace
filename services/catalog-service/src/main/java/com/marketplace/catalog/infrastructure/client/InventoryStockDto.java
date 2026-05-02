package com.marketplace.catalog.infrastructure.client;

public record InventoryStockDto(String productId, String sellerId, Integer stock) {
}
