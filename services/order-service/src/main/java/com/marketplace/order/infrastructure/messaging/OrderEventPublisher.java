package com.marketplace.order.infrastructure.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.order.domain.model.Order;
import com.marketplace.order.domain.model.OutboxEvent;
import com.marketplace.order.domain.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;
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

        try {
            OutboxEvent outboxEvent = OutboxEvent.create(
                    "order.created",
                    objectMapper.writeValueAsString(event)
            );
            outboxEventRepository.save(outboxEvent);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize order event", e);
        }

        kafkaTemplate.send("order.created", order.getId(), event);
        log.info("Order created event published: orderId={}", order.getId());
    }

    public void publishOrderCancelled(Order order) {
        Map<String, Object> event = new HashMap<>();
        event.put("orderId", order.getId());
        event.put("userId", order.getUserId());

        kafkaTemplate.send("order.cancelled", order.getId(), event);
        log.info("Order cancelled event published: orderId={}", order.getId());
    }
}