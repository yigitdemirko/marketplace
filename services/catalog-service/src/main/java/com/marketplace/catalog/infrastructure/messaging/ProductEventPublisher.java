package com.marketplace.catalog.infrastructure.messaging;

import com.marketplace.catalog.domain.model.Product;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductEventPublisher {

    private static final String UPDATED = "product.updated";
    private static final String CREATED = "product.created";
    private static final String DELETED = "product.deleted";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishProductUpdated(Product product) {
        Map<String, Object> event = new HashMap<>();
        event.put("id", product.getId());
        event.put("sellerId", product.getSellerId());
        event.put("name", product.getName());
        event.put("description", product.getDescription());
        event.put("price", product.getPrice());
        event.put("stock", product.getStock());
        event.put("categoryId", product.getCategoryId());
        event.put("images", product.getImages());
        event.put("attributes", product.getAttributes());
        event.put("active", product.isActive());

        kafkaTemplate.send(UPDATED, product.getId(), event);
        log.info("Product updated event published: productId={}", product.getId());
    }

    public void publishProductCreated(Product product) {
        Map<String, Object> event = new HashMap<>();
        event.put("productId", product.getId());
        event.put("sellerId", product.getSellerId());
        event.put("stock", product.getStock());
        kafkaTemplate.send(CREATED, product.getId(), event);
        log.info("Product created event published: productId={}", product.getId());
    }

    public void publishProductDeleted(String productId) {
        Map<String, Object> event = new HashMap<>();
        event.put("productId", productId);
        kafkaTemplate.send(DELETED, productId, event);
        log.info("Product deleted event published: productId={}", productId);
    }
}