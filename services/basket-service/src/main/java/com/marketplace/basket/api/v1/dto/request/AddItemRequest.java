package com.marketplace.basket.api.v1.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record AddItemRequest(
        @NotBlank String productId,
        @Min(1) int quantity
) {}
