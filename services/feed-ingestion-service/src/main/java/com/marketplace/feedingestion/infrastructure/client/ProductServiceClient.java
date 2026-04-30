package com.marketplace.feedingestion.infrastructure.client;

import com.marketplace.feedingestion.infrastructure.client.dto.BatchCreateResponse;
import com.marketplace.feedingestion.infrastructure.client.dto.CreateProductRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

@FeignClient(name = "product-service")
public interface ProductServiceClient {

    @PostMapping("/api/v1/products/batch")
    BatchCreateResponse createBatch(
            @RequestHeader("X-Seller-Id") String sellerId,
            @RequestBody List<CreateProductRequest> requests
    );
}
