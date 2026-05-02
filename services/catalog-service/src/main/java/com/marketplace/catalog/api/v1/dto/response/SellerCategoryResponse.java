package com.marketplace.catalog.api.v1.dto.response;

public record SellerCategoryResponse(
        String categoryId,
        long count
) {}
