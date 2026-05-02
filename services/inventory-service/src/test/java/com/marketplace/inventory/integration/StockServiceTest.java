package com.marketplace.inventory.integration;

import com.marketplace.inventory.application.service.StockService;
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

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@Tag("integration")
@SpringBootTest(properties = "inventory.bootstrap.enabled=false")
@Testcontainers
@ActiveProfiles("test")
class StockServiceTest {

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7-jammy");

    @Autowired
    private StockService stockService;

    @Autowired
    private ProductStockRepository productStockRepository;

    @Autowired
    private StockReservationRepository reservationRepository;

    @MockitoBean
    private InventoryEventPublisher eventPublisher;

    @BeforeEach
    void cleanState() {
        productStockRepository.deleteAll();
        reservationRepository.deleteAll();
    }

    @Test
    void should_ReserveExactlyOneOrder_WhenManyCompeteForLastUnit() throws InterruptedException {
        ProductStock stock = persisted("last-unit", 1);
        int contenders = 20;

        ExecutorService pool = Executors.newFixedThreadPool(contenders);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger successes = new AtomicInteger();
        AtomicInteger failures = new AtomicInteger();

        for (int i = 0; i < contenders; i++) {
            final String orderId = "order-" + i;
            pool.submit(() -> {
                try {
                    start.await();
                    Optional<String> failure = stockService.reserve(orderId, List.of(item(stock.getProductId(), 1)));
                    if (failure.isEmpty()) successes.incrementAndGet();
                    else failures.incrementAndGet();
                } catch (Exception e) {
                    failures.incrementAndGet();
                }
            });
        }
        start.countDown();
        pool.shutdown();
        boolean finished = pool.awaitTermination(15, TimeUnit.SECONDS);
        assertThat(finished).as("all reservation tasks finished").isTrue();

        assertThat(successes.get()).as("exactly one order wins the last unit").isEqualTo(1);
        assertThat(failures.get()).isEqualTo(contenders - 1);
        assertThat(productStockRepository.findById(stock.getProductId()).orElseThrow().getStock()).isZero();

        List<StockReservation> reservations = reservationRepository.findAll();
        assertThat(reservations).hasSize(1);
        assertThat(reservations.get(0).getStatus()).isEqualTo(StockReservation.Status.RESERVED);
    }

    @Test
    void should_NotDoubleDecrementStock_WhenSameOrderReservedTwice() {
        ProductStock stock = persisted("dup-order", 5);
        List<StockReservation.ReservedItem> items = List.of(item(stock.getProductId(), 2));

        Optional<String> first = stockService.reserve("order-1", items);
        Optional<String> second = stockService.reserve("order-1", items);

        assertThat(first).isEmpty();
        assertThat(second).isEmpty();
        assertThat(productStockRepository.findById(stock.getProductId()).orElseThrow().getStock()).isEqualTo(3);
        assertThat(reservationRepository.count()).isEqualTo(1);
    }

    @Test
    void should_RestoreStock_AndMarkReleased_WhenReservationReleased() {
        ProductStock stock = persisted("release-1", 5);
        stockService.reserve("order-1", List.of(item(stock.getProductId(), 2)));

        stockService.release("order-1");

        assertThat(productStockRepository.findById(stock.getProductId()).orElseThrow().getStock()).isEqualTo(5);
        StockReservation reservation = reservationRepository.findById("order-1").orElseThrow();
        assertThat(reservation.getStatus()).isEqualTo(StockReservation.Status.RELEASED);
    }

    @Test
    void should_NotIncrementStockTwice_WhenReleaseCalledTwice() {
        ProductStock stock = persisted("dup-release", 5);
        stockService.reserve("order-1", List.of(item(stock.getProductId(), 2)));

        stockService.release("order-1");
        stockService.release("order-1");

        assertThat(productStockRepository.findById(stock.getProductId()).orElseThrow().getStock()).isEqualTo(5);
    }

    @Test
    void should_RollbackPartialReservations_WhenOneItemHasInsufficientStock() {
        ProductStock itemA = persisted("item-a", 10);
        ProductStock itemB = persisted("item-b", 1);

        Optional<String> failure = stockService.reserve("order-multi", List.of(
                item(itemA.getProductId(), 5),
                item(itemB.getProductId(), 5)
        ));

        assertThat(failure).contains("Insufficient stock for productId=" + itemB.getProductId());
        assertThat(productStockRepository.findById(itemA.getProductId()).orElseThrow().getStock())
                .as("itemA decrement must be rolled back").isEqualTo(10);
        assertThat(productStockRepository.findById(itemB.getProductId()).orElseThrow().getStock()).isEqualTo(1);
        assertThat(reservationRepository.count()).as("no reservation persisted on failure").isZero();
    }

    private ProductStock persisted(String productId, int stock) {
        return productStockRepository.save(ProductStock.builder()
                .productId(productId)
                .sellerId("seller-1")
                .stock(stock)
                .build());
    }

    private StockReservation.ReservedItem item(String productId, int qty) {
        return StockReservation.ReservedItem.builder().productId(productId).quantity(qty).build();
    }
}
