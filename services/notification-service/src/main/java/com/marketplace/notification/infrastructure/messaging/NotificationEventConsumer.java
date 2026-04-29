package com.marketplace.notification.infrastructure.messaging;

import com.marketplace.notification.application.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventConsumer {

    private final NotificationService notificationService;

    @KafkaListener(topics = "order.created", groupId = "notification-service")
    public void handleOrderCreated(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        String userId = (String) event.get("userId");
        log.info("Order created notification: orderId={}", orderId);
        notificationService.sendOrderCreatedNotification(orderId, userId);
    }

    @KafkaListener(topics = "payment.completed", groupId = "notification-service")
    public void handlePaymentCompleted(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        String userId = (String) event.get("userId");
        log.info("Payment completed notification: orderId={}", orderId);
        notificationService.sendPaymentCompletedNotification(orderId, userId);
    }

    @KafkaListener(topics = "payment.failed", groupId = "notification-service")
    public void handlePaymentFailed(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        String userId = (String) event.get("userId");
        String reason = (String) event.get("reason");
        log.info("Payment failed notification: orderId={}", orderId);
        notificationService.sendPaymentFailedNotification(orderId, userId, reason);
    }

    @KafkaListener(topics = "order.cancelled", groupId = "notification-service")
    public void handleOrderCancelled(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        String userId = (String) event.get("userId");
        log.info("Order cancelled notification: orderId={}", orderId);
        notificationService.sendOrderCancelledNotification(orderId, userId);
    }
}