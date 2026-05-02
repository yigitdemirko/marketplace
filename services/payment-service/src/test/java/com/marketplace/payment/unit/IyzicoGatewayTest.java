package com.marketplace.payment.unit;

import com.iyzipay.model.Payment;
import com.iyzipay.model.PaymentCard;
import com.marketplace.payment.infrastructure.iyzico.IyzicoGateway;
import com.marketplace.payment.infrastructure.iyzico.IyzicoPaymentService;
import com.marketplace.payment.infrastructure.iyzico.IyzicoUnavailableException;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@Tag("unit")
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = {
        IyzicoGateway.class,
        AopAutoConfiguration.class,
        CircuitBreakerAutoConfiguration.class
})
@TestPropertySource(properties = {
        "spring.cloud.config.enabled=false",
        "resilience4j.circuitbreaker.instances.iyzico.slidingWindowSize=4",
        "resilience4j.circuitbreaker.instances.iyzico.minimumNumberOfCalls=2",
        "resilience4j.circuitbreaker.instances.iyzico.failureRateThreshold=50",
        "resilience4j.circuitbreaker.instances.iyzico.waitDurationInOpenState=30s"
})
class IyzicoGatewayTest {

    @Autowired
    private IyzicoGateway gateway;

    @MockBean
    private IyzicoPaymentService iyzicoPaymentService;

    @Autowired
    private CircuitBreakerRegistry registry;

    @BeforeEach
    void resetBreaker() {
        registry.circuitBreaker("iyzico").reset();
    }

    @Test
    void should_ReturnPayment_When_IyzicoResponds() {
        Payment expected = new Payment();
        expected.setStatus("success");
        when(iyzicoPaymentService.processPayment(anyString(), anyString(), any(BigDecimal.class), any(PaymentCard.class)))
                .thenReturn(expected);

        Payment result = gateway.processPayment("order-1", "u1", new BigDecimal("100"), new PaymentCard());

        assertThat(result.getStatus()).isEqualTo("success");
    }

    @Test
    void should_FallbackAndThrowUnavailable_When_CircuitOpens() {
        when(iyzicoPaymentService.processPayment(anyString(), anyString(), any(BigDecimal.class), any(PaymentCard.class)))
                .thenThrow(new RuntimeException("iyzico timeout"));

        for (int i = 0; i < 4; i++) {
            assertThatThrownBy(() -> gateway.processPayment("order-1", "u1", new BigDecimal("100"), new PaymentCard()))
                    .isInstanceOf(IyzicoUnavailableException.class)
                    .hasMessageContaining("Payment provider unavailable");
        }

        CircuitBreaker breaker = registry.circuitBreaker("iyzico");
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.OPEN);
    }
}
