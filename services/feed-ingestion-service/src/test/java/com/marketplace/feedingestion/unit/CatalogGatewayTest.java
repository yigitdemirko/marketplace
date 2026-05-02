package com.marketplace.feedingestion.unit;

import com.marketplace.feedingestion.infrastructure.client.CatalogGateway;
import com.marketplace.feedingestion.infrastructure.client.CatalogUnavailableException;
import com.marketplace.feedingestion.infrastructure.client.ProductServiceClient;
import com.marketplace.feedingestion.infrastructure.client.dto.BatchCreateResponse;
import com.marketplace.feedingestion.infrastructure.client.dto.CreateProductRequest;
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

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@Tag("unit")
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = {
        CatalogGateway.class,
        AopAutoConfiguration.class,
        CircuitBreakerAutoConfiguration.class
})
@TestPropertySource(properties = {
        "spring.cloud.config.enabled=false",
        "resilience4j.circuitbreaker.instances.catalog.slidingWindowSize=4",
        "resilience4j.circuitbreaker.instances.catalog.minimumNumberOfCalls=2",
        "resilience4j.circuitbreaker.instances.catalog.failureRateThreshold=50",
        "resilience4j.circuitbreaker.instances.catalog.waitDurationInOpenState=10s"
})
class CatalogGatewayTest {

    @Autowired
    private CatalogGateway gateway;

    @MockBean
    private ProductServiceClient client;

    @Autowired
    private CircuitBreakerRegistry registry;

    @BeforeEach
    void resetBreaker() {
        registry.circuitBreaker("catalog").reset();
    }

    @Test
    void should_ReturnBatchResponse_WhenClientSucceeds() {
        BatchCreateResponse stub = new BatchCreateResponse(1, 1, 0, List.of("p1"), Collections.emptyList());
        when(client.createBatch(anyString(), any())).thenReturn(stub);

        BatchCreateResponse result = gateway.createBatch("seller-1", List.of());

        assertThat(result.successCount()).isEqualTo(1);
    }

    @Test
    void should_ThrowUnavailable_WhenCircuitOpens() {
        when(client.createBatch(anyString(), any())).thenThrow(new RuntimeException("catalog down"));

        for (int i = 0; i < 4; i++) {
            assertThatThrownBy(() -> gateway.createBatch("seller-1", List.of()))
                    .isInstanceOf(CatalogUnavailableException.class);
        }

        CircuitBreaker breaker = registry.circuitBreaker("catalog");
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.OPEN);
    }
}
