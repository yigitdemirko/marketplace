package com.marketplace.order.unit;

import com.marketplace.order.infrastructure.client.ProductValidationGateway;
import com.marketplace.order.infrastructure.client.ProductValidationUnavailableException;
import com.marketplace.order.infrastructure.client.ProductValidationClient;
import com.marketplace.order.infrastructure.client.ValidateItem;
import com.marketplace.order.infrastructure.client.ValidatedProduct;
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

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@Tag("unit")
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = {
        ProductValidationGateway.class,
        AopAutoConfiguration.class,
        CircuitBreakerAutoConfiguration.class
})
@TestPropertySource(properties = {
        "spring.cloud.config.enabled=false",
        "resilience4j.circuitbreaker.instances.product.slidingWindowSize=4",
        "resilience4j.circuitbreaker.instances.product.minimumNumberOfCalls=2",
        "resilience4j.circuitbreaker.instances.product.failureRateThreshold=50",
        "resilience4j.circuitbreaker.instances.product.waitDurationInOpenState=10s"
})
class ProductValidationGatewayTest {

    @Autowired
    private ProductValidationGateway gateway;

    @MockBean
    private ProductValidationClient client;

    @Autowired
    private CircuitBreakerRegistry registry;

    @BeforeEach
    void resetBreaker() {
        registry.circuitBreaker("product").reset();
    }

    @Test
    void should_ReturnResults_When_ClientSucceeds() {
        when(client.validate(any())).thenReturn(List.of(
                new ValidatedProduct("p1", true, "s1", BigDecimal.TEN, 5, null)));

        List<ValidatedProduct> results = gateway.validate(List.of(new ValidateItem("p1", 1)));

        assertThat(results).hasSize(1);
        assertThat(results.get(0).valid()).isTrue();
    }

    @Test
    void should_FallbackAndThrow_When_CircuitOpens() {
        when(client.validate(any())).thenThrow(new RuntimeException("downstream down"));

        for (int i = 0; i < 4; i++) {
            assertThatThrownBy(() -> gateway.validate(List.of(new ValidateItem("p1", 1))))
                    .isInstanceOf(ProductValidationUnavailableException.class);
        }

        CircuitBreaker breaker = registry.circuitBreaker("product");
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.OPEN);
    }
}
