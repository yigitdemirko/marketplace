package com.marketplace.product.infrastructure.client;

public record InventoryStockDto(String productId, String sellerId, Integer stock) {
}
