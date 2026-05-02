package com.marketplace.product.unit;

import com.marketplace.product.infrastructure.client.InventoryClient;
import com.marketplace.product.infrastructure.client.InventoryGateway;
import com.marketplace.product.infrastructure.client.InventoryStockDto;
import com.marketplace.product.infrastructure.client.InventoryStockStatsDto;
import com.marketplace.product.infrastructure.client.InventoryUnavailableException;
import com.marketplace.product.infrastructure.client.SetStockRequest;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.springboot3.circuitbreaker.autoconfigure.CircuitBreakerAutoConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.aop.AopAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@Tag("unit")
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = {
        InventoryGateway.class,
        AopAutoConfiguration.class,
        CircuitBreakerAutoConfiguration.class
})
@TestPropertySource(properties = {
        "spring.cloud.config.enabled=false",
        "resilience4j.circuitbreaker.instances.inventory.slidingWindowSize=4",
        "resilience4j.circuitbreaker.instances.inventory.minimumNumberOfCalls=2",
        "resilience4j.circuitbreaker.instances.inventory.failureRateThreshold=50",
        "resilience4j.circuitbreaker.instances.inventory.waitDurationInOpenState=10s"
})
class InventoryGatewayTest {

    @Autowired
    private InventoryGateway gateway;

    @MockBean
    private InventoryClient client;

    @Autowired
    private CircuitBreakerRegistry registry;

    @BeforeEach
    void resetBreaker() {
        registry.circuitBreaker("inventory").reset();
    }

    @Test
    void should_ReturnStockBatch_WhenClientSucceeds() {
        when(client.getStockBatch(any())).thenReturn(List.of(
                new InventoryStockDto("p1", "s1", 5)));

        List<InventoryStockDto> result = gateway.getStockBatch(List.of("p1"));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).stock()).isEqualTo(5);
    }

    @Test
    void should_ThrowUnavailable_WhenStockBatchCircuitOpens() {
        when(client.getStockBatch(any())).thenThrow(new RuntimeException("inventory down"));

        for (int i = 0; i < 4; i++) {
            assertThatThrownBy(() -> gateway.getStockBatch(List.of("p1")))
                    .isInstanceOf(InventoryUnavailableException.class);
        }

        CircuitBreaker breaker = registry.circuitBreaker("inventory");
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.OPEN);
    }

    @Test
    void should_ReturnEmptyOptional_WhenSellerStatsCircuitOpens() {
        when(client.getSellerStats(anyString(), anyLong()))
                .thenThrow(new RuntimeException("inventory down"));

        Optional<InventoryStockStatsDto> result = null;
        for (int i = 0; i < 4; i++) {
            result = gateway.getSellerStats("seller-1", 10);
        }

        assertThat(result).isEmpty();
        CircuitBreaker breaker = registry.circuitBreaker("inventory");
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.OPEN);
    }

    @Test
    void should_ThrowUnavailable_WhenSetStockCircuitOpens() {
        when(client.setStock(eq("p1"), any(SetStockRequest.class)))
                .thenThrow(new RuntimeException("inventory down"));

        for (int i = 0; i < 4; i++) {
            assertThatThrownBy(() -> gateway.setStock("p1", "s1", 10))
                    .isInstanceOf(InventoryUnavailableException.class);
        }

        CircuitBreaker breaker = registry.circuitBreaker("inventory");
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.OPEN);
    }
}
