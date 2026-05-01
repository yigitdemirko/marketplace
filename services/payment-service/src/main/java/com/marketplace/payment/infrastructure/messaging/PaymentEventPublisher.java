package com.marketplace.payment.infrastructure.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.payment.domain.model.Payment;
import com.marketplace.payment.domain.model.PaymentOutboxEvent;
import com.marketplace.payment.domain.repository.PaymentOutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventPublisher {

    private final PaymentOutboxEventRepository outboxRepository;
    private final ObjectMapper objectMapper;

    public void publishPaymentCompleted(Payment payment) {
        Map<String, Object> event = new HashMap<>();
        event.put("paymentId", payment.getId());
        event.put("orderId", payment.getOrderId());
        event.put("userId", payment.getUserId());
        event.put("amount", payment.getAmount());

        saveOutbox("payment.completed", payment.getOrderId(), event);
        log.info("Payment completed event queued: orderId={}", payment.getOrderId());
    }

    public void publishPaymentFailed(Payment payment) {
        Map<String, Object> event = new HashMap<>();
        event.put("paymentId", payment.getId());
        event.put("orderId", payment.getOrderId());
        event.put("userId", payment.getUserId());
        event.put("reason", payment.getFailureReason());

        saveOutbox("payment.failed", payment.getOrderId(), event);
        log.info("Payment failed event queued: orderId={}", payment.getOrderId());
    }

    private void saveOutbox(String eventType, String aggregateId, Map<String, Object> payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            outboxRepository.save(PaymentOutboxEvent.create(eventType, aggregateId, json));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize payment outbox event", e);
        }
    }
}
