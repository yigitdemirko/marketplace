package com.marketplace.catalog.infrastructure.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "inventory-service", contextId = "inventoryClient")
public interface InventoryClient {

    @PostMapping("/api/v1/inventory/batch")
    List<InventoryStockDto> getStockBatch(@RequestBody List<String> productIds);

    @GetMapping("/api/v1/inventory/seller/{sellerId}/stats")
    InventoryStockStatsDto getSellerStats(@PathVariable("sellerId") String sellerId,
                                          @RequestParam("totalActive") long totalActive);

    @PutMapping("/api/v1/inventory/{productId}/stock")
    InventoryStockDto setStock(@PathVariable("productId") String productId,
                               @RequestBody SetStockRequest body);
}
