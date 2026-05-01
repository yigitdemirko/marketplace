package com.marketplace.product.integration;

import com.marketplace.product.application.service.StockService;
import com.marketplace.product.domain.model.Product;
import com.marketplace.product.domain.model.StockReservation;
import com.marketplace.product.domain.repository.ProductRepository;
import com.marketplace.product.domain.repository.StockReservationRepository;
import com.marketplace.product.infrastructure.messaging.ProductEventPublisher;
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
import software.amazon.awssdk.services.s3.S3Client;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@Tag("integration")
@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
class StockServiceConcurrencyTest {

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7-jammy");

    @Autowired
    private StockService stockService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StockReservationRepository reservationRepository;

    @MockitoBean
    private ProductEventPublisher productEventPublisher;

    @MockitoBean
    private S3Client s3Client;

    @BeforeEach
    void cleanState() {
        productRepository.deleteAll();
        reservationRepository.deleteAll();
    }

    @Test
    void should_ReserveExactlyOneOrder_WhenManyCompeteForLastUnit() throws InterruptedException {
        Product product = persisted("last-unit", 1);
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
                    Optional<String> failure = stockService.reserve(orderId, List.of(item(product.getId(), 1)));
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
        assertThat(productRepository.findById(product.getId()).orElseThrow().getStock()).isZero();

        List<StockReservation> reservations = reservationRepository.findAll();
        assertThat(reservations).hasSize(1);
        assertThat(reservations.get(0).getStatus()).isEqualTo(StockReservation.Status.RESERVED);
    }

    @Test
    void should_NotDoubleDecrementStock_WhenSameOrderReservedTwice() {
        Product product = persisted("dup-order", 5);
        List<StockReservation.ReservedItem> items = List.of(item(product.getId(), 2));

        Optional<String> first = stockService.reserve("order-1", items);
        Optional<String> second = stockService.reserve("order-1", items);

        assertThat(first).isEmpty();
        assertThat(second).isEmpty();
        assertThat(productRepository.findById(product.getId()).orElseThrow().getStock()).isEqualTo(3);
        assertThat(reservationRepository.count()).isEqualTo(1);
    }

    @Test
    void should_RestoreStock_AndMarkReleased_WhenReservationReleased() {
        Product product = persisted("release-1", 5);
        stockService.reserve("order-1", List.of(item(product.getId(), 2)));

        stockService.release("order-1");

        assertThat(productRepository.findById(product.getId()).orElseThrow().getStock()).isEqualTo(5);
        StockReservation reservation = reservationRepository.findById("order-1").orElseThrow();
        assertThat(reservation.getStatus()).isEqualTo(StockReservation.Status.RELEASED);
    }

    @Test
    void should_NotIncrementStockTwice_WhenReleaseCalledTwice() {
        Product product = persisted("dup-release", 5);
        stockService.reserve("order-1", List.of(item(product.getId(), 2)));

        stockService.release("order-1");
        stockService.release("order-1");

        assertThat(productRepository.findById(product.getId()).orElseThrow().getStock()).isEqualTo(5);
    }

    @Test
    void should_RollbackPartialReservations_WhenOneItemHasInsufficientStock() {
        Product itemA = persisted("item-a", 10);
        Product itemB = persisted("item-b", 1);

        Optional<String> failure = stockService.reserve("order-multi", List.of(
                item(itemA.getId(), 5),
                item(itemB.getId(), 5)
        ));

        assertThat(failure).contains("Insufficient stock for productId=" + itemB.getId());
        assertThat(productRepository.findById(itemA.getId()).orElseThrow().getStock())
                .as("itemA decrement must be rolled back").isEqualTo(10);
        assertThat(productRepository.findById(itemB.getId()).orElseThrow().getStock()).isEqualTo(1);
        assertThat(reservationRepository.count()).as("no reservation persisted on failure").isZero();
    }

    private Product persisted(String name, int stock) {
        Product p = Product.create("seller-1", name, "desc", new BigDecimal("10.00"), stock, "cat-1");
        return productRepository.save(p);
    }

    private StockReservation.ReservedItem item(String productId, int qty) {
        return StockReservation.ReservedItem.builder().productId(productId).quantity(qty).build();
    }
}
