package com.marketplace.order.infrastructure.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(name = "catalog-service", contextId = "productValidationClient")
public interface ProductValidationClient {

    @PostMapping("/api/v1/products/validate")
    List<ValidatedProduct> validate(@RequestBody List<ValidateItem> items);
}
