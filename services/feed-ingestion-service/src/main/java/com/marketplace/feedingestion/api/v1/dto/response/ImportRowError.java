package com.marketplace.feedingestion.api.v1.dto.response;

public record ImportRowError(int index, String productId, String message) {}
