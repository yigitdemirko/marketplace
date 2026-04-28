package com.marketplace.order.infrastructure.messaging;

import com.marketplace.order.application.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class StockEventConsumer {

    private final OrderService orderService;

    @KafkaListener(topics = "stock.reserved", groupId = "order-service")
    public void handleStockReserved(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        log.info("Stock reserved event received: orderId={}", orderId);
        orderService.confirmStock(orderId);
    }

    @KafkaListener(topics = "stock.reservation.failed", groupId = "order-service")
    public void handleStockReservationFailed(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        String reason = (String) event.get("reason");
        log.info("Stock reservation failed event received: orderId={}", orderId);
        orderService.cancelOrderBySaga(orderId, reason);
    }

    @KafkaListener(topics = "payment.completed", groupId = "order-service")
    public void handlePaymentCompleted(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        log.info("Payment completed event received: orderId={}", orderId);
        orderService.confirmPayment(orderId);
    }

    @KafkaListener(topics = "payment.failed", groupId = "order-service")
    public void handlePaymentFailed(Map<String, Object> event) {
        String orderId = (String) event.get("orderId");
        String reason = (String) event.get("reason");
        log.info("Payment failed event received: orderId={}", orderId);
        orderService.cancelOrderBySaga(orderId, reason);
    }
}