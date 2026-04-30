package com.marketplace.feedingestion.infrastructure.client.dto;

import java.util.List;

public record BatchCreateResponse(
        int totalItems,
        int successCount,
        int failureCount,
        List<String> createdProductIds,
        List<BatchCreateFailure> failures
) {}
