package com.marketplace.inventory.integration;

import com.marketplace.inventory.application.scheduler.ReservationCleanupScheduler;
import com.marketplace.inventory.domain.model.ProductStock;
import com.marketplace.inventory.domain.model.StockReservation;
import com.marketplace.inventory.domain.repository.ProductStockRepository;
import com.marketplace.inventory.domain.repository.StockReservationRepository;
import com.marketplace.inventory.infrastructure.messaging.InventoryEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@Tag("integration")
@SpringBootTest(properties = {
        "inventory.bootstrap.enabled=false",
        "app.reservation.cleanup-interval-ms=600000",
        "app.reservation.initial-delay-ms=600000"
})
@Testcontainers
@ActiveProfiles("test")
class ReservationCleanupSchedulerTest {

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7-jammy");

    @Autowired
    private ReservationCleanupScheduler scheduler;

    @Autowired
    private StockReservationRepository reservationRepository;

    @Autowired
    private ProductStockRepository productStockRepository;

    @MockitoBean
    private InventoryEventPublisher eventPublisher;

    @BeforeEach
    void cleanState() {
        reservationRepository.deleteAll();
        productStockRepository.deleteAll();
    }

    @Test
    void should_ReleaseStock_AndPublishExpiredEvent_WhenReservationPastTtl() {
        ProductStock stock = persistedStock("p-1", 5);
        persistedReservation("order-expired", stock.getProductId(), 2,
                StockReservation.Status.RESERVED, LocalDateTime.now().minusMinutes(1));

        scheduler.releaseExpiredReservations();

        ProductStock after = productStockRepository.findById(stock.getProductId()).orElseThrow();
        assertThat(after.getStock()).as("stock returned to caller").isEqualTo(7);

        StockReservation reservation = reservationRepository.findById("order-expired").orElseThrow();
        assertThat(reservation.getStatus()).isEqualTo(StockReservation.Status.RELEASED);

        verify(eventPublisher).publishReservationExpired(eq("order-expired"), eq(ReservationCleanupScheduler.EXPIRED_REASON));
    }

    @Test
    void should_LeaveReservationUntouched_WhenStillWithinTtl() {
        ProductStock stock = persistedStock("p-1", 5);
        persistedReservation("order-fresh", stock.getProductId(), 2,
                StockReservation.Status.RESERVED, LocalDateTime.now().plusMinutes(10));

        scheduler.releaseExpiredReservations();

        assertThat(productStockRepository.findById(stock.getProductId()).orElseThrow().getStock()).isEqualTo(5);
        assertThat(reservationRepository.findById("order-fresh").orElseThrow().getStatus())
                .isEqualTo(StockReservation.Status.RESERVED);
        verify(eventPublisher, never()).publishReservationExpired(eq("order-fresh"), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void should_SkipAlreadyReleasedReservations_EvenWhenPastTtl() {
        ProductStock stock = persistedStock("p-1", 5);
        persistedReservation("order-already-released", stock.getProductId(), 2,
                StockReservation.Status.RELEASED, LocalDateTime.now().minusHours(1));

        scheduler.releaseExpiredReservations();

        assertThat(productStockRepository.findById(stock.getProductId()).orElseThrow().getStock())
                .as("released reservations must not double-credit stock").isEqualTo(5);
        verify(eventPublisher, never()).publishReservationExpired(eq("order-already-released"), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void should_ProcessOnlyExpiredReservations_WhenMixedBatch() {
        ProductStock stock = persistedStock("p-1", 10);
        persistedReservation("order-a-expired", stock.getProductId(), 1,
                StockReservation.Status.RESERVED, LocalDateTime.now().minusMinutes(5));
        persistedReservation("order-b-fresh", stock.getProductId(), 2,
                StockReservation.Status.RESERVED, LocalDateTime.now().plusMinutes(5));
        persistedReservation("order-c-expired", stock.getProductId(), 3,
                StockReservation.Status.RESERVED, LocalDateTime.now().minusMinutes(2));

        scheduler.releaseExpiredReservations();

        assertThat(productStockRepository.findById(stock.getProductId()).orElseThrow().getStock())
                .as("only expired reservations release stock (1 + 3 returned)").isEqualTo(14);
        assertThat(reservationRepository.findById("order-a-expired").orElseThrow().getStatus())
                .isEqualTo(StockReservation.Status.RELEASED);
        assertThat(reservationRepository.findById("order-b-fresh").orElseThrow().getStatus())
                .isEqualTo(StockReservation.Status.RESERVED);
        assertThat(reservationRepository.findById("order-c-expired").orElseThrow().getStatus())
                .isEqualTo(StockReservation.Status.RELEASED);
        verify(eventPublisher, times(2)).publishReservationExpired(org.mockito.ArgumentMatchers.anyString(), eq(ReservationCleanupScheduler.EXPIRED_REASON));
    }

    private ProductStock persistedStock(String productId, int stock) {
        return productStockRepository.save(ProductStock.builder()
                .productId(productId)
                .sellerId("seller-1")
                .stock(stock)
                .build());
    }

    private void persistedReservation(String orderId, String productId, int qty,
                                      StockReservation.Status status, LocalDateTime expiresAt) {
        reservationRepository.save(StockReservation.builder()
                .orderId(orderId)
                .items(List.of(StockReservation.ReservedItem.builder()
                        .productId(productId).quantity(qty).build()))
                .status(status)
                .expiresAt(expiresAt)
                .build());
    }
}
