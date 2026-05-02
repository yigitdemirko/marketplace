package com.marketplace.product.infrastructure.client;

public record InventoryStockStatsDto(long inStock, long outOfStock, long lowStock) {
}
