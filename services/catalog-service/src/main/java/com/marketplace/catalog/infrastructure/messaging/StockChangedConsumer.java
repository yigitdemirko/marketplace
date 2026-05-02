package com.marketplace.catalog.infrastructure.messaging;

import com.marketplace.catalog.domain.model.Product;
import com.marketplace.catalog.domain.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class StockChangedConsumer {

    private final ProductRepository productRepository;
    private final ProductEventPublisher productEventPublisher;

    @KafkaListener(topics = "stock.changed", groupId = "catalog-service")
    public void handleStockChanged(Map<String, Object> event) {
        String productId = (String) event.get("productId");
        Number stockNumber = (Number) event.get("stock");
        if (productId == null || stockNumber == null) {
            return;
        }
        int newStock = stockNumber.intValue();

        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            log.warn("Stock changed for unknown product: productId={}", productId);
            return;
        }
        Product product = productOpt.get();
        if (product.getStock() != null && product.getStock() == newStock) {
            return;
        }
        product.setStock(newStock);
        Product saved = productRepository.save(product);
        productEventPublisher.publishProductUpdated(saved);
        log.info("Cached product stock updated from inventory: productId={} stock={}", productId, newStock);
    }
}
