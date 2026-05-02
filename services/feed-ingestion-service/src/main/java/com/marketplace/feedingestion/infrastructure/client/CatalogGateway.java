package com.marketplace.feedingestion.infrastructure.client;

import com.marketplace.feedingestion.infrastructure.client.dto.BatchCreateResponse;
import com.marketplace.feedingestion.infrastructure.client.dto.CreateProductRequest;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CatalogGateway {

    private final ProductServiceClient client;

    @CircuitBreaker(name = "catalog", fallbackMethod = "createBatchFallback")
    public BatchCreateResponse createBatch(String sellerId, List<CreateProductRequest> requests) {
        return client.createBatch(sellerId, requests);
    }

    @SuppressWarnings("unused")
    private BatchCreateResponse createBatchFallback(String sellerId, List<CreateProductRequest> requests, Throwable t) {
        log.warn("Catalog batch create failed (CB fallback): {}", t.getMessage());
        throw new CatalogUnavailableException("Catalog unavailable, import not applied", t);
    }
}
