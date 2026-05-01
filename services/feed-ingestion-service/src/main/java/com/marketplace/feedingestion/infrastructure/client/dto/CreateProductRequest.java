package com.marketplace.feedingestion.infrastructure.client.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record CreateProductRequest(
        String name,
        String description,
        BigDecimal price,
        Integer stock,
        Category category,
        String locale,
        String brand,
        List<String> images,
        Map<String, String> attributes
) {}
