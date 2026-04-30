package com.marketplace.payment.infrastructure.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "order-service", contextId = "orderClient")
public interface OrderClient {

    @GetMapping("/api/v1/orders/{orderId}")
    OrderSummary getOrder(
            @PathVariable("orderId") String orderId,
            @RequestHeader("X-User-Id") String userId
    );
}
