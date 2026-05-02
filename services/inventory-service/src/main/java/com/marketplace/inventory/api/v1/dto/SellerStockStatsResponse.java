package com.marketplace.inventory.api.v1.dto;

public record SellerStockStatsResponse(long inStock, long outOfStock, long lowStock) {
}
