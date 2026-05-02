package com.marketplace.inventory.infrastructure.messaging;

import com.marketplace.inventory.domain.model.ProductStock;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventoryEventPublisher {

    private static final String STOCK_CHANGED = "stock.changed";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishStockChanged(ProductStock stock) {
        Map<String, Object> event = new HashMap<>();
        event.put("productId", stock.getProductId());
        event.put("sellerId", stock.getSellerId());
        event.put("stock", stock.getStock());
        kafkaTemplate.send(STOCK_CHANGED, stock.getProductId(), event);
        log.info("Stock changed event published: productId={} stock={}", stock.getProductId(), stock.getStock());
    }
}
