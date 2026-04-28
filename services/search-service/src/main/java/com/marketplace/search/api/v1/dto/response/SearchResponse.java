package com.marketplace.search.api.v1.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record SearchResponse(
        String id,
        String name,
        String description,
        String sellerId,
        String categoryId,
        BigDecimal price,
        Integer stock,
        boolean active,
        List<String> images,
        Map<String, String> attributes
) {}