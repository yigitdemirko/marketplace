package com.marketplace.payment.infrastructure.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderServiceGateway {

    private final OrderClient orderClient;

    @CircuitBreaker(name = "order", fallbackMethod = "getOrderFallback")
    public OrderSummary getOrder(String orderId, String userId) {
        return orderClient.getOrder(orderId, userId);
    }

    @SuppressWarnings("unused")
    private OrderSummary getOrderFallback(String orderId, String userId, Throwable t) {
        log.warn("Order service circuit open or call failed for orderId={}: {}", orderId, t.getMessage());
        throw new OrderServiceUnavailableException(
                "Order service unavailable, please retry shortly", t);
    }
}
