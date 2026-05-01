package com.marketplace.payment.unit;

import com.marketplace.payment.infrastructure.client.OrderClient;
import com.marketplace.payment.infrastructure.client.OrderServiceGateway;
import com.marketplace.payment.infrastructure.client.OrderServiceUnavailableException;
import com.marketplace.payment.infrastructure.client.OrderSummary;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@Tag("unit")
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = {
        OrderServiceGateway.class,
        AopAutoConfiguration.class,
        CircuitBreakerAutoConfiguration.class
})
@TestPropertySource(properties = {
        "spring.cloud.config.enabled=false",
        "resilience4j.circuitbreaker.instances.order.slidingWindowSize=4",
        "resilience4j.circuitbreaker.instances.order.minimumNumberOfCalls=2",
        "resilience4j.circuitbreaker.instances.order.failureRateThreshold=50",
        "resilience4j.circuitbreaker.instances.order.waitDurationInOpenState=10s"
})
class OrderServiceGatewayTest {

    @Autowired
    private OrderServiceGateway gateway;

    @MockBean
    private OrderClient orderClient;

    @Autowired
    private CircuitBreakerRegistry registry;

    @BeforeEach
    void resetBreaker() {
        registry.circuitBreaker("order").reset();
    }

    @Test
    void should_ReturnOrder_When_OrderServiceResponds() {
        OrderSummary expected = new OrderSummary("order-1", "user-1", "PAYMENT_PENDING", BigDecimal.valueOf(250));
        when(orderClient.getOrder(anyString(), anyString())).thenReturn(expected);

        OrderSummary result = gateway.getOrder("order-1", "user-1");

        assertThat(result.id()).isEqualTo("order-1");
        assertThat(result.status()).isEqualTo("PAYMENT_PENDING");
        assertThat(result.totalAmount()).isEqualByComparingTo(BigDecimal.valueOf(250));
    }

    @Test
    void should_FallbackAndThrow_When_CircuitOpens() {
        when(orderClient.getOrder(anyString(), anyString()))
                .thenThrow(new RuntimeException("order-service down"));

        for (int i = 0; i < 4; i++) {
            assertThatThrownBy(() -> gateway.getOrder("order-1", "user-1"))
                    .isInstanceOf(OrderServiceUnavailableException.class)
                    .hasMessageContaining("unavailable");
        }

        CircuitBreaker breaker = registry.circuitBreaker("order");
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.OPEN);
    }
}
