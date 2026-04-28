package com.marketplace.product.infrastructure.messaging;

import com.marketplace.product.application.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @KafkaListener(topics = "order.created", groupId = "product-service")
    public void handleOrderCreated(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        List<Map<String, Object>> items = (List<Map<String, Object>>) event.get("items");

        log.info("Order created event received: orderId={}", orderId);

        try {
            // Stok kontrolü — şimdilik her zaman başarılı, asil implementasyonda azaltilacak
            Map<String, Object> reservedEvent = new HashMap<>();
            reservedEvent.put("orderId", orderId);
            reservedEvent.put("userId", event.get("userId"));

            kafkaTemplate.send("stock.reserved", orderId, reservedEvent);
            log.info("Stock reserved for orderId={}", orderId);

        } catch (Exception e) {
            Map<String, Object> failedEvent = new HashMap<>();
            failedEvent.put("orderId", orderId);
            failedEvent.put("reason", e.getMessage());

            kafkaTemplate.send("stock.reservation.failed", orderId, failedEvent);
            log.error("Stock reservation failed for orderId={}", orderId, e);
        }
    }
}