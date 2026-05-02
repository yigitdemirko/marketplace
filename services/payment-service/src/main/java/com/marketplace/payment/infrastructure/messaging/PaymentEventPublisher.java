package com.marketplace.payment.infrastructure.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.common.events.PaymentCompletedEvent;
import com.marketplace.common.events.PaymentFailedEvent;
import com.marketplace.common.messaging.KafkaTopics;
import com.marketplace.payment.domain.model.Payment;
import com.marketplace.payment.domain.model.PaymentOutboxEvent;
import com.marketplace.payment.domain.repository.PaymentOutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventPublisher {

    private final PaymentOutboxEventRepository outboxRepository;
    private final ObjectMapper objectMapper;

    public void publishPaymentCompleted(Payment payment) {
        PaymentCompletedEvent event = new PaymentCompletedEvent(
                payment.getId(),
                payment.getOrderId(),
                payment.getUserId(),
                payment.getAmount()
        );
        saveOutbox(KafkaTopics.PAYMENT_COMPLETED, payment.getOrderId(), event);
        log.info("Payment completed event queued: orderId={}", payment.getOrderId());
    }

    public void publishPaymentFailed(Payment payment) {
        PaymentFailedEvent event = new PaymentFailedEvent(
                payment.getId(),
                payment.getOrderId(),
                payment.getUserId(),
                payment.getFailureReason()
        );
        saveOutbox(KafkaTopics.PAYMENT_FAILED, payment.getOrderId(), event);
        log.info("Payment failed event queued: orderId={}", payment.getOrderId());
    }

    private void saveOutbox(String eventType, String aggregateId, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            outboxRepository.save(PaymentOutboxEvent.create(eventType, aggregateId, json));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize payment outbox event", e);
        }
    }
}
