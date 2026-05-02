package com.marketplace.notification.infrastructure.messaging;

import com.marketplace.notification.application.service.NotificationService;
import com.marketplace.notification.domain.model.Notification;
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
        if (skip(userId, orderId, "order.created")) return;
        notificationService.create(
                userId,
                Notification.Type.ORDER_CREATED,
                "Order received",
                "Your order #" + shortId(orderId) + " is being processed.",
                "/orders/" + orderId
        );
    }

    @KafkaListener(topics = "payment.completed", groupId = "notification-service")
    public void handlePaymentCompleted(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        String userId = (String) event.get("userId");
        if (skip(userId, orderId, "payment.completed")) return;
        notificationService.create(
                userId,
                Notification.Type.PAYMENT_COMPLETED,
                "Payment confirmed",
                "Payment for order #" + shortId(orderId) + " was successful.",
                "/orders/" + orderId
        );
    }

    @KafkaListener(topics = "payment.failed", groupId = "notification-service")
    public void handlePaymentFailed(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        String userId = (String) event.get("userId");
        String reason = (String) event.get("reason");
        if (skip(userId, orderId, "payment.failed")) return;
        notificationService.create(
                userId,
                Notification.Type.PAYMENT_FAILED,
                "Payment failed",
                "Payment for order #" + shortId(orderId) + " could not be processed. " +
                        (reason != null && !reason.isBlank() ? reason : "Please try again."),
                "/orders/" + orderId
        );
    }

    @KafkaListener(topics = "order.cancelled", groupId = "notification-service")
    public void handleOrderCancelled(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        String userId = (String) event.get("userId");
        if (skip(userId, orderId, "order.cancelled")) return;
        notificationService.create(
                userId,
                Notification.Type.ORDER_CANCELLED,
                "Order cancelled",
                "Your order #" + shortId(orderId) + " has been cancelled.",
                "/orders/" + orderId
        );
    }

    private boolean skip(String userId, String orderId, String eventType) {
        if (userId == null || userId.isBlank()) {
            log.warn("Skipping {} notification: missing userId, orderId={}", eventType, orderId);
            return true;
        }
        return false;
    }

    private String shortId(String orderId) {
        if (orderId == null) return "?";
        return orderId.length() > 8 ? orderId.substring(0, 8) : orderId;
    }
}
