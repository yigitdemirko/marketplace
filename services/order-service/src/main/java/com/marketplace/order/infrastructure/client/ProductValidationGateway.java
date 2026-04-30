package com.marketplace.order.infrastructure.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductValidationGateway {

    private final ProductValidationClient client;

    @CircuitBreaker(name = "product", fallbackMethod = "validateFallback")
    public List<ValidatedProduct> validate(List<ValidateItem> items) {
        return client.validate(items);
    }

    @SuppressWarnings("unused")
    private List<ValidatedProduct> validateFallback(List<ValidateItem> items, Throwable t) {
        log.warn("Product validation circuit open or call failed: {}", t.getMessage());
        throw new ProductValidationUnavailableException(
                "Product service unavailable, please retry shortly", t);
    }
}
