package com.marketplace.inventory.infrastructure.messaging;

import com.marketplace.inventory.domain.model.ProductStock;
import com.marketplace.inventory.domain.repository.ProductStockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductLifecycleConsumer {

    private final ProductStockRepository repository;

    @KafkaListener(topics = "product.created", groupId = "inventory-service")
    public void handleProductCreated(Map<String, Object> event) {
        String productId = (String) event.get("productId");
        if (productId == null || repository.existsById(productId)) {
            return;
        }
        String sellerId = (String) event.get("sellerId");
        Integer stock = ((Number) event.getOrDefault("stock", 0)).intValue();
        repository.save(ProductStock.builder()
                .productId(productId)
                .sellerId(sellerId)
                .stock(stock)
                .build());
        log.info("Initialised stock from product.created: productId={} stock={}", productId, stock);
    }

    @KafkaListener(topics = "product.deleted", groupId = "inventory-service")
    public void handleProductDeleted(Map<String, Object> event) {
        String productId = (String) event.get("productId");
        if (productId == null) {
            return;
        }
        repository.deleteById(productId);
        log.info("Removed stock for deleted product: productId={}", productId);
    }
}
