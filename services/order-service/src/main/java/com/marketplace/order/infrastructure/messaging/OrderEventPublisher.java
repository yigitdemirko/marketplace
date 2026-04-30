package com.marketplace.order.infrastructure.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.order.domain.model.Order;
import com.marketplace.order.domain.model.OutboxEvent;
import com.marketplace.order.domain.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventPublisher {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    public void publishOrderCreated(Order order) {
        Map<String, Object> event = new HashMap<>();
        event.put("orderId", order.getId());
        event.put("userId", order.getUserId());
        event.put("items", order.getItems().stream().map(item -> {
            Map<String, Object> itemMap = new HashMap<>();
            itemMap.put("productId", item.getProductId());
            itemMap.put("sellerId", item.getSellerId());
            itemMap.put("quantity", item.getQuantity());
            itemMap.put("unitPrice", item.getUnitPrice());
            return itemMap;
        }).toList());
        event.put("totalAmount", order.getTotalAmount());

        saveOutbox("order.created", order.getId(), event);
        log.info("Order created event queued: orderId={}", order.getId());
    }

    public void publishOrderCancelled(Order order) {
        Map<String, Object> event = new HashMap<>();
        event.put("orderId", order.getId());
        event.put("userId", order.getUserId());

        saveOutbox("order.cancelled", order.getId(), event);
        log.info("Order cancelled event queued: orderId={}", order.getId());
    }

    private void saveOutbox(String eventType, String aggregateId, Map<String, Object> payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            outboxEventRepository.save(OutboxEvent.create(eventType, aggregateId, json));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize outbox event", e);
        }
    }
}
