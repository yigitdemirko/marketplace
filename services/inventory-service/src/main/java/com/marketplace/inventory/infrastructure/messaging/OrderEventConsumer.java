package com.marketplace.inventory.infrastructure.messaging;

import com.marketplace.common.events.StockReservationFailedEvent;
import com.marketplace.common.events.StockReservedEvent;
import com.marketplace.common.messaging.KafkaTopics;
import com.marketplace.inventory.application.service.StockService;
import com.marketplace.inventory.domain.model.StockReservation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final StockService stockService;

    @KafkaListener(topics = KafkaTopics.ORDER_CREATED, groupId = "inventory-service")
    @SuppressWarnings("unchecked")
    public void handleOrderCreated(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        List<Map<String, Object>> rawItems = (List<Map<String, Object>>) event.get("items");
        log.info("Order created event received: orderId={}", orderId);

        List<StockReservation.ReservedItem> items = rawItems.stream()
                .map(item -> StockReservation.ReservedItem.builder()
                        .productId((String) item.get("productId"))
                        .quantity(((Number) item.get("quantity")).intValue())
                        .build())
                .toList();

        try {
            Optional<String> failure = stockService.reserve(orderId, items);
            if (failure.isPresent()) {
                publishReservationFailed(orderId, failure.get());
                return;
            }
            publishReserved(orderId, event.get("userId"));
        } catch (Exception e) {
            log.error("Stock reservation error for orderId={}", orderId, e);
            publishReservationFailed(orderId, e.getMessage());
        }
    }

    @KafkaListener(topics = KafkaTopics.ORDER_CANCELLED, groupId = "inventory-service")
    public void handleOrderCancelled(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        log.info("Order cancelled event received: orderId={}", orderId);
        try {
            stockService.release(orderId);
        } catch (Exception e) {
            log.error("Stock release error for orderId={}", orderId, e);
        }
    }

    private void publishReserved(String orderId, Object userId) {
        StockReservedEvent event = new StockReservedEvent(orderId, userId == null ? null : userId.toString());
        kafkaTemplate.send(KafkaTopics.STOCK_RESERVED, orderId, event);
        log.info("Stock reserved for orderId={}", orderId);
    }

    private void publishReservationFailed(String orderId, String reason) {
        StockReservationFailedEvent event = new StockReservationFailedEvent(orderId, reason);
        kafkaTemplate.send(KafkaTopics.STOCK_RESERVATION_FAILED, orderId, event);
        log.warn("Stock reservation failed for orderId={} reason={}", orderId, reason);
    }
}
