package com.marketplace.inventory.integration;

import com.marketplace.inventory.application.service.StockService;
import com.marketplace.inventory.domain.model.ProductStock;
import com.marketplace.inventory.domain.repository.ProductStockRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;

@Tag("integration")
@SpringBootTest(properties = "inventory.bootstrap.enabled=false")
@Testcontainers
@ActiveProfiles("test")
class SetStockTest {

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7-jammy");

    @Autowired
    private StockService stockService;

    @Autowired
    private ProductStockRepository repository;

    @MockitoBean
    private InventoryEventPublisher eventPublisher;

    @BeforeEach
    void cleanState() {
        repository.deleteAll();
    }

    @Test
    void should_CreateStockEntry_When_ProductMissing() {
        ProductStock saved = stockService.setStock("new-p", "seller-1", 25);

        assertThat(saved.getStock()).isEqualTo(25);
        assertThat(repository.findById("new-p")).isPresent();
        verify(eventPublisher).publishStockChanged(saved);
    }

    @Test
    void should_OverwriteStock_When_ProductExists() {
        repository.save(ProductStock.builder()
                .productId("p-1").sellerId("seller-1").stock(10).build());

        ProductStock saved = stockService.setStock("p-1", "seller-1", 99);

        assertThat(saved.getStock()).isEqualTo(99);
        assertThat(repository.findById("p-1").orElseThrow().getStock()).isEqualTo(99);
    }

    @Test
    void should_RejectNegativeStock() {
        assertThatThrownBy(() -> stockService.setStock("p-1", "seller-1", -1))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
