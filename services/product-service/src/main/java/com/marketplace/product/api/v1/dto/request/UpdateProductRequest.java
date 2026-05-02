package com.marketplace.product.api.v1.dto.request;

import com.marketplace.product.domain.model.Category;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record UpdateProductRequest(
        String name,
        String description,
        @DecimalMin("0.01") BigDecimal price,
        @Min(0) Integer stock,
        Category category,
        String brand,
        List<String> images,
        Map<String, String> attributes
) {}
