package com.marketplace.inventory.infrastructure.messaging;

import com.marketplace.common.events.StockChangedEvent;
import com.marketplace.common.events.StockReservationExpiredEvent;
import com.marketplace.common.messaging.KafkaTopics;
import com.marketplace.inventory.domain.model.ProductStock;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventoryEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishStockChanged(ProductStock stock) {
        StockChangedEvent event = new StockChangedEvent(
                stock.getProductId(),
                stock.getSellerId(),
                stock.getStock()
        );
        kafkaTemplate.send(KafkaTopics.STOCK_CHANGED, stock.getProductId(), event);
        log.info("Stock changed event published: productId={} stock={}", stock.getProductId(), stock.getStock());
    }

    public void publishReservationExpired(String orderId, String reason) {
        StockReservationExpiredEvent event = new StockReservationExpiredEvent(orderId, reason);
        kafkaTemplate.send(KafkaTopics.STOCK_RESERVATION_EXPIRED, orderId, event);
        log.info("Reservation expired event published: orderId={} reason={}", orderId, reason);
    }
}
