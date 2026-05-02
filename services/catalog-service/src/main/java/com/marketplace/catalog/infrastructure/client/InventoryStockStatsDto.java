package com.marketplace.catalog.infrastructure.client;

public record InventoryStockStatsDto(long inStock, long outOfStock, long lowStock) {
}
