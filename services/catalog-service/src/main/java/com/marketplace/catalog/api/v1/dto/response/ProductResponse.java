package com.marketplace.catalog.api.v1.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record ProductResponse(
        String id,
        String sellerId,
        String name,
        String description,
        BigDecimal price,
        Integer stock,
        String categoryId,
        String brand,
        List<String> images,
        Map<String, String> attributes,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
