package com.marketplace.product.domain.model;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Document(collection = "products")
@Getter
@Setter
@Builder
public class Product {

    @Id
    private String id;

    private String sellerId;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stock;
    private String categoryId;
    private String brand;
    private List<String> images;
    private Map<String, String> attributes;
    private boolean active;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public static Product create(String sellerId, String name, String description,
                                 BigDecimal price, Integer stock, String categoryId) {
        return Product.builder()
                .id(UUID.randomUUID().toString())
                .sellerId(sellerId)
                .name(name)
                .description(description)
                .price(price)
                .stock(stock)
                .categoryId(categoryId)
                .active(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}