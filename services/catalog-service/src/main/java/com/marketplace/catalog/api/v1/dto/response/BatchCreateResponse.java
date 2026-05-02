package com.marketplace.catalog.api.v1.dto.response;

import java.util.List;

public record BatchCreateResponse(
        int totalItems,
        int successCount,
        int failureCount,
        List<String> createdProductIds,
        List<BatchCreateFailure> failures
) {}
