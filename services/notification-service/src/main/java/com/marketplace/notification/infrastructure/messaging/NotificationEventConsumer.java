package com.marketplace.notification.infrastructure.messaging;

import com.marketplace.notification.application.service.NotificationService;
import com.marketplace.notification.infrastructure.client.UserContact;
import com.marketplace.notification.infrastructure.client.UserContactClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventConsumer {

    private final NotificationService notificationService;
    private final UserContactClient userContactClient;

    @KafkaListener(topics = "order.created", groupId = "notification-service")
    public void handleOrderCreated(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        String userId = (String) event.get("userId");
        resolveEmail(userId, orderId, "order.created").ifPresent(email ->
                notificationService.sendOrderCreatedNotification(email, orderId));
    }

    @KafkaListener(topics = "payment.completed", groupId = "notification-service")
    public void handlePaymentCompleted(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        String userId = (String) event.get("userId");
        resolveEmail(userId, orderId, "payment.completed").ifPresent(email ->
                notificationService.sendPaymentCompletedNotification(email, orderId));
    }

    @KafkaListener(topics = "payment.failed", groupId = "notification-service")
    public void handlePaymentFailed(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        String userId = (String) event.get("userId");
        String reason = (String) event.get("reason");
        resolveEmail(userId, orderId, "payment.failed").ifPresent(email ->
                notificationService.sendPaymentFailedNotification(email, orderId, reason));
    }

    @KafkaListener(topics = "order.cancelled", groupId = "notification-service")
    public void handleOrderCancelled(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        String userId = (String) event.get("userId");
        resolveEmail(userId, orderId, "order.cancelled").ifPresent(email ->
                notificationService.sendOrderCancelledNotification(email, orderId));
    }

    private Optional<String> resolveEmail(String userId, String orderId, String eventType) {
        if (userId == null || userId.isBlank()) {
            log.warn("Skipping {} notification: missing userId, orderId={}", eventType, orderId);
            return Optional.empty();
        }
        try {
            UserContact contact = userContactClient.getContact(userId);
            if (contact == null || contact.email() == null || contact.email().isBlank()) {
                log.warn("Skipping {} notification: empty contact for userId={}, orderId={}",
                        eventType, userId, orderId);
                return Optional.empty();
            }
            return Optional.of(contact.email());
        } catch (Exception e) {
            log.error("Skipping {} notification: failed to resolve email userId={}, orderId={}",
                    eventType, userId, orderId, e);
            return Optional.empty();
        }
    }
}
