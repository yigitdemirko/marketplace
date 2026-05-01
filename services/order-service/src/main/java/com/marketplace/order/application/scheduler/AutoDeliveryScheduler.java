package com.marketplace.order.application.scheduler;

import com.marketplace.order.application.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AutoDeliveryScheduler {

    private final OrderService orderService;

    @Scheduled(fixedDelay = 60000)
    public void deliverShippedOrders() {
        orderService.autoDeliverShippedOrders();
    }
}
