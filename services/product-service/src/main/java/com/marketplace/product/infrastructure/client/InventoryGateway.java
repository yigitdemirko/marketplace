package com.marketplace.product.infrastructure.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventoryGateway {

    private final InventoryClient client;

    @CircuitBreaker(name = "inventory", fallbackMethod = "getStockBatchFallback")
    public List<InventoryStockDto> getStockBatch(List<String> productIds) {
        return client.getStockBatch(productIds);
    }

    @CircuitBreaker(name = "inventory", fallbackMethod = "getSellerStatsFallback")
    public Optional<InventoryStockStatsDto> getSellerStats(String sellerId, long totalActive) {
        return Optional.of(client.getSellerStats(sellerId, totalActive));
    }

    @CircuitBreaker(name = "inventory", fallbackMethod = "setStockFallback")
    public InventoryStockDto setStock(String productId, String sellerId, int stock) {
        return client.setStock(productId, new SetStockRequest(sellerId, stock));
    }

    @SuppressWarnings("unused")
    private List<InventoryStockDto> getStockBatchFallback(List<String> productIds, Throwable t) {
        log.warn("Inventory batch lookup failed (CB fallback): {}", t.getMessage());
        throw new InventoryUnavailableException("Inventory unavailable, please retry shortly", t);
    }

    @SuppressWarnings("unused")
    private Optional<InventoryStockStatsDto> getSellerStatsFallback(String sellerId, long totalActive, Throwable t) {
        log.warn("Inventory seller stats failed (CB fallback): {}", t.getMessage());
        return Optional.empty();
    }

    @SuppressWarnings("unused")
    private InventoryStockDto setStockFallback(String productId, String sellerId, int stock, Throwable t) {
        log.warn("Inventory set-stock failed (CB fallback): {}", t.getMessage());
        throw new InventoryUnavailableException("Inventory unavailable, stock change not applied", t);
    }
}
