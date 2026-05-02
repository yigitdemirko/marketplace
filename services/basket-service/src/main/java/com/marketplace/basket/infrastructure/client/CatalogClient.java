package com.marketplace.basket.infrastructure.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(name = "catalog-service")
public interface CatalogClient {

    @PostMapping("/api/v1/products/validate")
    List<CatalogProductDto> validate(@RequestBody List<ValidateItemRequest> items);
}
