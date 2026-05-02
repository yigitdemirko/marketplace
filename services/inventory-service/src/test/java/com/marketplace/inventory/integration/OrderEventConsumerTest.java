package com.marketplace.inventory.integration;

import com.marketplace.inventory.application.service.StockService;
import com.marketplace.inventory.domain.model.ProductStock;
import com.marketplace.inventory.domain.model.StockReservation;
import com.marketplace.inventory.domain.repository.ProductStockRepository;
import com.marketplace.inventory.domain.repository.StockReservationRepository;
import com.marketplace.inventory.infrastructure.messaging.InventoryEventPublisher;
import com.marketplace.inventory.infrastructure.messaging.OrderEventConsumer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@Tag("integration")
@SpringBootTest(properties = "inventory.bootstrap.enabled=false")
@Testcontainers
@ActiveProfiles("test")
@ExtendWith(MockitoExtension.class)
class OrderEventConsumerTest {

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7-jammy");

    @Autowired
    private OrderEventConsumer consumer;

    @Autowired
    private ProductStockRepository productStockRepository;

    @Autowired
    private StockReservationRepository reservationRepository;

    @MockitoBean
    private InventoryEventPublisher inventoryEventPublisher;

    @MockitoBean
    @SuppressWarnings("rawtypes")
    private KafkaTemplate kafkaTemplate;

    @BeforeEach
    void cleanState() {
        productStockRepository.deleteAll();
        reservationRepository.deleteAll();
        Mockito.reset(kafkaTemplate, inventoryEventPublisher);
    }

    @Test
    void should_DecrementStock_AndPublishReserved_WhenOrderCreated() {
        productStockRepository.save(ProductStock.builder()
                .productId("p-1").sellerId("s-1").stock(5).build());

        consumer.handleOrderCreated(Map.of(
                "orderId", "order-1",
                "userId", "user-1",
                "items", List.of(Map.of("productId", "p-1", "quantity", 2))
        ));

        ProductStock after = productStockRepository.findById("p-1").orElseThrow();
        assertThat(after.getStock()).isEqualTo(3);

        StockReservation reservation = reservationRepository.findById("order-1").orElseThrow();
        assertThat(reservation.getStatus()).isEqualTo(StockReservation.Status.RESERVED);

        verify(kafkaTemplate).send(eq("stock.reserved"), eq("order-1"), Mockito.any());
    }

    @Test
    void should_PublishReservationFailed_WhenStockInsufficient() {
        productStockRepository.save(ProductStock.builder()
                .productId("p-1").sellerId("s-1").stock(1).build());

        consumer.handleOrderCreated(Map.of(
                "orderId", "order-2",
                "userId", "user-1",
                "items", List.of(Map.of("productId", "p-1", "quantity", 5))
        ));

        ProductStock after = productStockRepository.findById("p-1").orElseThrow();
        assertThat(after.getStock()).as("stock unchanged when reservation fails").isEqualTo(1);
        assertThat(reservationRepository.count()).isZero();

        ArgumentCaptor<Map<String, Object>> payload = ArgumentCaptor.forClass(Map.class);
        verify(kafkaTemplate).send(eq("stock.reservation.failed"), eq("order-2"), payload.capture());
        assertThat(payload.getValue().get("reason").toString()).contains("Insufficient stock");
    }

    @Test
    void should_RestoreStock_WhenOrderCancelled() {
        productStockRepository.save(ProductStock.builder()
                .productId("p-1").sellerId("s-1").stock(10).build());
        consumer.handleOrderCreated(Map.of(
                "orderId", "order-3",
                "userId", "user-1",
                "items", List.of(Map.of("productId", "p-1", "quantity", 3))
        ));
        assertThat(productStockRepository.findById("p-1").orElseThrow().getStock()).isEqualTo(7);

        consumer.handleOrderCancelled(Map.of("orderId", "order-3"));

        assertThat(productStockRepository.findById("p-1").orElseThrow().getStock()).isEqualTo(10);
        assertThat(reservationRepository.findById("order-3").orElseThrow().getStatus())
                .isEqualTo(StockReservation.Status.RELEASED);
    }
}
