package com.marketplace.common.events;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record ProductUpdatedEvent(
        String id,
        String sellerId,
        String name,
        String description,
        BigDecimal price,
        int stock,
        String categoryId,
        List<String> images,
        Map<String, String> attributes,
        boolean active
) {}
