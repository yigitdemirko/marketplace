package com.marketplace.basket.api.v1.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record MergeBasketRequest(
        @NotNull @Valid List<MergeItem> items
) {
    public record MergeItem(String productId, int quantity) {}
}
