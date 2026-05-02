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
    private static final String RESERVATION_EXPIRED = "stock.reservation.expired";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishStockChanged(ProductStock stock) {
        Map<String, Object> event = new HashMap<>();
        event.put("productId", stock.getProductId());
        event.put("sellerId", stock.getSellerId());
        event.put("stock", stock.getStock());
        kafkaTemplate.send(STOCK_CHANGED, stock.getProductId(), event);
        log.info("Stock changed event published: productId={} stock={}", stock.getProductId(), stock.getStock());
    }

    public void publishReservationExpired(String orderId, String reason) {
        Map<String, Object> event = new HashMap<>();
        event.put("orderId", orderId);
        event.put("reason", reason);
        kafkaTemplate.send(RESERVATION_EXPIRED, orderId, event);
        log.info("Reservation expired event published: orderId={} reason={}", orderId, reason);
    }
}
