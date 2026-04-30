package com.marketplace.feedingestion.api.v1.dto.response;

import com.marketplace.feedingestion.domain.model.ImportStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ImportJobResponse(
        UUID id,
        String sellerId,
        String fileName,
        int totalItems,
        int successCount,
        int failureCount,
        ImportStatus status,
        List<ImportRowError> errors,
        LocalDateTime createdAt,
        LocalDateTime completedAt
) {}
