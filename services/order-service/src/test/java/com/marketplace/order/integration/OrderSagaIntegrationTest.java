package com.marketplace.order.integration;

import com.marketplace.order.api.v1.dto.request.CreateOrderRequest;
import com.marketplace.order.api.v1.dto.request.OrderItemRequest;
import com.marketplace.order.api.v1.dto.response.OrderResponse;
import com.marketplace.order.domain.model.Order;
import com.marketplace.order.domain.model.OrderStatus;
import com.marketplace.order.domain.repository.OrderRepository;
import com.marketplace.order.domain.repository.OutboxEventRepository;
import com.marketplace.order.infrastructure.client.ProductValidationClient;
import com.marketplace.order.infrastructure.client.ValidatedProduct;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@Tag("integration")
@SpringBootTest(webEnvironment = RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
@EmbeddedKafka(partitions = 1, topics = {
        "order.created", "order.cancelled",
        "stock.reserved", "stock.reservation.failed",
        "payment.completed", "payment.failed"
})
class OrderSagaIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void overrideProps(DynamicPropertyRegistry reg) {
        reg.add("app.outbox.poll-interval-ms", () -> "200");
    }

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OutboxEventRepository outboxRepository;

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @MockitoBean
    private ProductValidationClient productValidationClient;

    @BeforeEach
    void stubProductValidation() {
        when(productValidationClient.validate(any())).thenReturn(List.of(
                new ValidatedProduct("prod-1", true, "seller-1",
                        new BigDecimal("50.00"), 100, null)
        ));
    }

    @Test
    void should_TransitionThroughSaga_WhenStockReservedAndPaymentSucceed() {
        OrderResponse created = postOrder("user-1");
        assertThat(created.status()).isEqualTo(OrderStatus.STOCK_RESERVING.name());
        assertThat(created.totalAmount()).isEqualByComparingTo(new BigDecimal("100.00"));

        awaitOutboxProcessed("order.created", created.id());

        kafkaTemplate.send("stock.reserved", created.id(), Map.of(
                "orderId", created.id(),
                "userId", "user-1"
        ));
        awaitStatus(created.id(), OrderStatus.PAYMENT_PENDING);

        kafkaTemplate.send("payment.completed", created.id(), Map.of(
                "orderId", created.id(),
                "userId", "user-1"
        ));
        awaitStatus(created.id(), OrderStatus.CONFIRMED);
    }

    @Test
    void should_CancelOrder_WhenStockReservationFails() {
        OrderResponse created = postOrder("user-1");

        kafkaTemplate.send("stock.reservation.failed", created.id(), Map.of(
                "orderId", created.id(),
                "reason", "Insufficient stock"
        ));

        awaitStatus(created.id(), OrderStatus.CANCELLED);
        awaitOutboxProcessed("order.cancelled", created.id());
    }

    @Test
    void should_CancelOrder_WhenPaymentFails() {
        OrderResponse created = postOrder("user-1");

        kafkaTemplate.send("stock.reserved", created.id(), Map.of(
                "orderId", created.id(),
                "userId", "user-1"
        ));
        awaitStatus(created.id(), OrderStatus.PAYMENT_PENDING);

        kafkaTemplate.send("payment.failed", created.id(), Map.of(
                "orderId", created.id(),
                "reason", "Card declined"
        ));
        awaitStatus(created.id(), OrderStatus.CANCELLED);
        awaitOutboxProcessed("order.cancelled", created.id());
    }

    private OrderResponse postOrder(String userId) {
        CreateOrderRequest body = new CreateOrderRequest(
                List.of(new OrderItemRequest("prod-1", 2)),
                "Test address",
                UUID.randomUUID().toString()
        );
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("X-User-Id", userId);

        ResponseEntity<OrderResponse> resp = rest.exchange(
                "/api/v1/orders", HttpMethod.POST,
                new HttpEntity<>(body, headers),
                OrderResponse.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        OrderResponse created = resp.getBody();
        assertThat(created).isNotNull();
        return created;
    }

    private void awaitStatus(String orderId, OrderStatus expected) {
        await().atMost(Duration.ofSeconds(15)).pollInterval(Duration.ofMillis(200))
                .untilAsserted(() -> {
                    Order order = orderRepository.findById(orderId).orElseThrow();
                    assertThat(order.getStatus()).isEqualTo(expected);
                });
    }

    private void awaitOutboxProcessed(String eventType, String aggregateId) {
        await().atMost(Duration.ofSeconds(10)).pollInterval(Duration.ofMillis(200))
                .untilAsserted(() -> assertThat(outboxRepository.findAll())
                        .anyMatch(e -> e.getEventType().equals(eventType)
                                && e.getAggregateId().equals(aggregateId)
                                && e.isProcessed()));
    }
}
