package com.marketplace.inventory.api.v1.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SetStockRequest(
        @NotBlank String sellerId,
        @NotNull @Min(0) Integer stock
) {
}
