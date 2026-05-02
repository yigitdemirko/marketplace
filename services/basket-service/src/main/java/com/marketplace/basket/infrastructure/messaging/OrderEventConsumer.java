package com.marketplace.basket.infrastructure.messaging;

import com.marketplace.basket.application.service.BasketService;
import com.marketplace.common.messaging.KafkaTopics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final BasketService basketService;

    @KafkaListener(topics = KafkaTopics.ORDER_CREATED, groupId = "basket-service")
    @SuppressWarnings("unchecked")
    public void handleOrderCreated(Map<String, Object> event) {
        String userId = (String) event.get("userId");
        String orderId = (String) event.get("orderId");
        if (userId == null || userId.isBlank()) {
            log.warn("order.created without userId, skipping basket cleanup: orderId={}", orderId);
            return;
        }

        Object rawItems = event.get("items");
        if (!(rawItems instanceof List<?> list) || list.isEmpty()) {
            return;
        }

        List<String> productIds = list.stream()
                .filter(Map.class::isInstance)
                .map(Map.class::cast)
                .map(m -> (String) m.get("productId"))
                .filter(id -> id != null && !id.isBlank())
                .toList();

        if (productIds.isEmpty()) {
            return;
        }

        try {
            basketService.removeOrderedItems(userId, productIds);
            log.info("Removed {} ordered items from basket: userId={}, orderId={}",
                    productIds.size(), userId, orderId);
        } catch (Exception e) {
            log.error("Failed to remove ordered items from basket: userId={}, orderId={}", userId, orderId, e);
        }
    }
}
