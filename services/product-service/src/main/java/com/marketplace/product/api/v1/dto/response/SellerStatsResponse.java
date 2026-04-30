package com.marketplace.product.api.v1.dto.response;

public record SellerStatsResponse(
        long total,
        long inStock,
        long outOfStock,
        long lowStock
) {}
