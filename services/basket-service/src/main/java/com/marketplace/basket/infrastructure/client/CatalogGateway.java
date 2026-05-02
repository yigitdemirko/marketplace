package com.marketplace.basket.infrastructure.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CatalogGateway {

    private final CatalogClient client;

    @CircuitBreaker(name = "catalog", fallbackMethod = "validateFallback")
    public List<CatalogProductDto> validate(List<ValidateItemRequest> items) {
        return client.validate(items);
    }

    @SuppressWarnings("unused")
    private List<CatalogProductDto> validateFallback(List<ValidateItemRequest> items, Throwable t) {
        log.warn("Catalog validate fallback (CB open or call failed): {}", t.getMessage());
        return Collections.emptyList();
    }
}
