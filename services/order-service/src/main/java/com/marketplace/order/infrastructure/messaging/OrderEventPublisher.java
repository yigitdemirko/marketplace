package com.marketplace.order.infrastructure.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.common.events.OrderCancelledEvent;
import com.marketplace.common.events.OrderCreatedEvent;
import com.marketplace.common.messaging.KafkaTopics;
import com.marketplace.order.domain.model.Order;
import com.marketplace.order.domain.model.OutboxEvent;
import com.marketplace.order.domain.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventPublisher {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    public void publishOrderCreated(Order order) {
        OrderCreatedEvent event = new OrderCreatedEvent(
                order.getId(),
                order.getUserId(),
                order.getItems().stream()
                        .map(item -> new OrderCreatedEvent.Item(
                                item.getProductId(),
                                item.getSellerId(),
                                item.getQuantity(),
                                item.getUnitPrice()))
                        .toList(),
                order.getTotalAmount()
        );
        saveOutbox(KafkaTopics.ORDER_CREATED, order.getId(), event);
        log.info("Order created event queued: orderId={}", order.getId());
    }

    public void publishOrderCancelled(Order order) {
        OrderCancelledEvent event = new OrderCancelledEvent(order.getId(), order.getUserId());
        saveOutbox(KafkaTopics.ORDER_CANCELLED, order.getId(), event);
        log.info("Order cancelled event queued: orderId={}", order.getId());
    }

    private void saveOutbox(String eventType, String aggregateId, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            outboxEventRepository.save(OutboxEvent.create(eventType, aggregateId, json));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize outbox event", e);
        }
    }
}
