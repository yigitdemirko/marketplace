package com.marketplace.product.infrastructure.messaging;

import com.marketplace.product.domain.model.Product;
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

    private static final String TOPIC = "product.updated";

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

        kafkaTemplate.send(TOPIC, product.getId(), event);
        log.info("Product event published: productId={}", product.getId());
    }
}