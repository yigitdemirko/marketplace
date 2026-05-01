package com.marketplace.notification.infrastructure.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", contextId = "userContactClient")
public interface UserContactClient {

    @GetMapping("/api/v1/users/{userId}/contact")
    UserContact getContact(@PathVariable("userId") String userId);
}
