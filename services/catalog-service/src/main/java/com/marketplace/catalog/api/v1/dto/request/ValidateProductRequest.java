package com.marketplace.catalog.api.v1.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ValidateProductRequest(
        @NotBlank String productId,
        @NotNull @Min(1) Integer quantity
) {}
