package com.marketplace.payment.infrastructure.messaging;

import com.marketplace.payment.domain.model.Payment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishPaymentCompleted(Payment payment) {
        Map<String, Object> event = new HashMap<>();
        event.put("paymentId", payment.getId());
        event.put("orderId", payment.getOrderId());
        event.put("userId", payment.getUserId());
        event.put("amount", payment.getAmount());

        kafkaTemplate.send("payment.completed", payment.getOrderId(), event);
        log.info("Payment completed event published: orderId={}", payment.getOrderId());
    }

    public void publishPaymentFailed(Payment payment) {
        Map<String, Object> event = new HashMap<>();
        event.put("paymentId", payment.getId());
        event.put("orderId", payment.getOrderId());
        event.put("userId", payment.getUserId());
        event.put("reason", payment.getFailureReason());

        kafkaTemplate.send("payment.failed", payment.getOrderId(), event);
        log.info("Payment failed event published: orderId={}", payment.getOrderId());
    }
}