package com.marketplace.notification.integration;

import com.marketplace.notification.domain.model.Notification;
import com.marketplace.notification.domain.repository.NotificationRepository;
import com.marketplace.notification.infrastructure.messaging.NotificationEventConsumer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@Tag("integration")
@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
class NotificationConsumerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private NotificationEventConsumer consumer;

    @Autowired
    private NotificationRepository repository;

    @BeforeEach
    void clean() {
        repository.deleteAll();
    }

    @Test
    void should_PersistOrderCreatedNotification() {
        consumer.handleOrderCreated(Map.of(
                "orderId", "order-123",
                "userId", "user-1",
                "items", List.of()
        ));

        List<Notification> notifications = repository.findAll();
        assertThat(notifications).hasSize(1);
        Notification n = notifications.get(0);
        assertThat(n.getUserId()).isEqualTo("user-1");
        assertThat(n.getType()).isEqualTo(Notification.Type.ORDER_CREATED);
        assertThat(n.getTitle()).isEqualTo("Order received");
        assertThat(n.getLink()).isEqualTo("/orders/order-123");
        assertThat(n.isRead()).isFalse();
    }

    @Test
    void should_PersistPaymentCompletedNotification() {
        consumer.handlePaymentCompleted(Map.of(
                "orderId", "order-456",
                "userId", "user-1",
                "amount", 99.99
        ));

        Notification n = repository.findAll().get(0);
        assertThat(n.getType()).isEqualTo(Notification.Type.PAYMENT_COMPLETED);
        assertThat(n.getBody()).contains("order-45");
    }

    @Test
    void should_PersistPaymentFailedWithReason() {
        consumer.handlePaymentFailed(Map.of(
                "orderId", "order-789",
                "userId", "user-1",
                "reason", "Card declined"
        ));

        Notification n = repository.findAll().get(0);
        assertThat(n.getType()).isEqualTo(Notification.Type.PAYMENT_FAILED);
        assertThat(n.getBody()).contains("Card declined");
    }

    @Test
    void should_SkipNotification_When_UserIdMissing() {
        consumer.handleOrderCreated(Map.of(
                "orderId", "order-no-user"
        ));

        assertThat(repository.count()).isZero();
    }

    @Test
    void should_PersistOrderCancelledNotification() {
        consumer.handleOrderCancelled(Map.of(
                "orderId", "order-cancel",
                "userId", "user-1"
        ));

        Notification n = repository.findAll().get(0);
        assertThat(n.getType()).isEqualTo(Notification.Type.ORDER_CANCELLED);
    }
}
