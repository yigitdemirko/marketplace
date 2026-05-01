package com.marketplace.order.integration;

import com.marketplace.order.api.v1.dto.request.CreateOrderRequest;
import com.marketplace.order.api.v1.dto.request.OrderItemRequest;
import com.marketplace.order.api.v1.dto.response.OrderResponse;
import com.marketplace.order.domain.model.OutboxEvent;
import com.marketplace.order.domain.repository.OrderRepository;
import com.marketplace.order.domain.repository.OutboxEventRepository;
import com.marketplace.order.infrastructure.client.ProductValidationClient;
import com.marketplace.order.infrastructure.client.ValidatedProduct;
import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
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
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.test.EmbeddedKafkaBroker;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.kafka.test.utils.KafkaTestUtils;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@Tag("integration")
@SpringBootTest(webEnvironment = RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
@EmbeddedKafka(partitions = 1, topics = {"order.created", "order.cancelled"})
class OrderOutboxIntegrationTest {

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
    private EmbeddedKafkaBroker embeddedKafka;

    @MockitoBean
    private ProductValidationClient productValidationClient;

    @SuppressWarnings("rawtypes")
    @MockitoSpyBean
    private KafkaTemplate kafkaTemplate;

    @MockitoSpyBean
    private OutboxEventRepository outboxRepositorySpy;

    @BeforeEach
    void setUp() {
        Mockito.reset(kafkaTemplate, outboxRepositorySpy);
        when(productValidationClient.validate(any())).thenReturn(List.of(
                new ValidatedProduct("prod-1", true, "seller-1",
                        new BigDecimal("50.00"), 100, null)
        ));
        orderRepository.deleteAll();
        outboxRepository.deleteAll();
    }

    @Test
    void should_DeliverOrderCreatedToKafka_AndMarkOutboxProcessed() {
        Consumer<String, Object> consumer = newConsumer();
        consumer.subscribe(List.of("order.created"));
        consumer.poll(Duration.ZERO);

        OrderResponse created = postOrder("user-1");

        await().atMost(Duration.ofSeconds(10)).pollInterval(Duration.ofMillis(200))
                .untilAsserted(() -> assertThat(outboxRepository.findAll())
                        .filteredOn(e -> e.getAggregateId().equals(created.id())
                                && e.getEventType().equals("order.created"))
                        .singleElement()
                        .matches(OutboxEvent::isProcessed, "processed=true"));

        ConsumerRecords<String, Object> records = KafkaTestUtils.getRecords(consumer, Duration.ofSeconds(5));
        boolean foundOurOrder = false;
        for (ConsumerRecord<String, Object> record : records) {
            if (created.id().equals(record.key())) {
                Map<String, Object> payload = asMap(record.value());
                assertThat(payload.get("orderId")).isEqualTo(created.id());
                assertThat(payload.get("userId")).isEqualTo("user-1");
                foundOurOrder = true;
            }
        }
        consumer.close();
        assertThat(foundOurOrder).as("order.created delivered with our orderId as Kafka key").isTrue();
    }

    @Test
    void should_RollbackOrder_WhenOutboxWriteFails() {
        doThrow(new RuntimeException("Outbox DB down"))
                .when(outboxRepositorySpy).save(any(OutboxEvent.class));

        ResponseEntity<String> resp = postOrderRaw("user-1");

        assertThat(resp.getStatusCode().is5xxServerError() || resp.getStatusCode().is4xxClientError())
                .as("API surfaces the failure").isTrue();
        assertThat(orderRepository.findAll()).as("order rolled back with outbox").isEmpty();
    }

    @Test
    void should_KeepOutboxUnprocessed_WhileKafkaDown_AndDrain_OnceRecovered() throws InterruptedException {
        AtomicBoolean kafkaBroken = new AtomicBoolean(true);
        doAnswer(inv -> {
            if (kafkaBroken.get()) {
                CompletableFuture<SendResult<String, Object>> failed = new CompletableFuture<>();
                failed.completeExceptionally(new RuntimeException("Kafka down"));
                return failed;
            }
            return inv.callRealMethod();
        }).when(kafkaTemplate).send(anyString(), anyString(), any());

        OrderResponse created = postOrder("user-1");

        await().atMost(Duration.ofSeconds(2)).untilAsserted(() ->
                assertThat(findOutbox(created.id())).isPresent());

        Thread.sleep(800);
        assertThat(findOutbox(created.id()).orElseThrow().isProcessed())
                .as("scheduled poller does not mark processed while Kafka fails").isFalse();

        kafkaBroken.set(false);

        await().atMost(Duration.ofSeconds(10)).pollInterval(Duration.ofMillis(200))
                .untilAsserted(() -> assertThat(findOutbox(created.id()).orElseThrow().isProcessed())
                        .as("outbox drains once Kafka recovers").isTrue());
    }

    private Optional<OutboxEvent> findOutbox(String aggregateId) {
        return outboxRepository.findAll().stream()
                .filter(e -> e.getAggregateId().equals(aggregateId)
                        && e.getEventType().equals("order.created"))
                .findFirst();
    }

    private OrderResponse postOrder(String userId) {
        ResponseEntity<OrderResponse> resp = exchange(userId, OrderResponse.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        OrderResponse body = resp.getBody();
        assertThat(body).isNotNull();
        return body;
    }

    private ResponseEntity<String> postOrderRaw(String userId) {
        return exchange(userId, String.class);
    }

    private <T> ResponseEntity<T> exchange(String userId, Class<T> type) {
        CreateOrderRequest body = new CreateOrderRequest(
                List.of(new OrderItemRequest("prod-1", 2)),
                "Test address",
                UUID.randomUUID().toString()
        );
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("X-User-Id", userId);
        return rest.exchange("/api/v1/orders", HttpMethod.POST,
                new HttpEntity<>(body, headers), type);
    }

    private Consumer<String, Object> newConsumer() {
        Map<String, Object> props = KafkaTestUtils.consumerProps(
                "outbox-test-" + UUID.randomUUID(), "true", embeddedKafka);
        JsonDeserializer<Object> valueDeserializer = new JsonDeserializer<>(Object.class, false);
        valueDeserializer.addTrustedPackages("*");
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), valueDeserializer)
                .createConsumer();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        return (Map<String, Object>) value;
    }
}
