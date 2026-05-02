package com.marketplace.basket.api.v1.dto.request;

import jakarta.validation.constraints.Min;

public record SetItemRequest(
        @Min(0) int quantity
) {}
