package com.marketplace.catalog.infrastructure.messaging;

import com.marketplace.catalog.domain.model.Product;
import com.marketplace.common.events.ProductCreatedEvent;
import com.marketplace.common.events.ProductDeletedEvent;
import com.marketplace.common.events.ProductUpdatedEvent;
import com.marketplace.common.messaging.KafkaTopics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishProductUpdated(Product product) {
        ProductUpdatedEvent event = new ProductUpdatedEvent(
                product.getId(),
                product.getSellerId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock(),
                product.getCategoryId(),
                product.getImages(),
                product.getAttributes(),
                product.isActive()
        );
        kafkaTemplate.send(KafkaTopics.PRODUCT_UPDATED, product.getId(), event);
        log.info("Product updated event published: productId={}", product.getId());
    }

    public void publishProductCreated(Product product) {
        ProductCreatedEvent event = new ProductCreatedEvent(
                product.getId(),
                product.getSellerId(),
                product.getStock()
        );
        kafkaTemplate.send(KafkaTopics.PRODUCT_CREATED, product.getId(), event);
        log.info("Product created event published: productId={}", product.getId());
    }

    public void publishProductDeleted(String productId) {
        ProductDeletedEvent event = new ProductDeletedEvent(productId);
        kafkaTemplate.send(KafkaTopics.PRODUCT_DELETED, productId, event);
        log.info("Product deleted event published: productId={}", productId);
    }
}
