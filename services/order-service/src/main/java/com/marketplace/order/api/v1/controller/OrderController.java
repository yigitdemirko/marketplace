package com.marketplace.order.api.v1.controller;

import com.marketplace.order.api.v1.dto.request.CreateOrderRequest;
import com.marketplace.order.api.v1.dto.response.OrderResponse;
import com.marketplace.order.api.v1.dto.response.SellerStatsResponse;
import com.marketplace.order.application.service.OrderService;
import com.marketplace.order.domain.model.OrderStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.createOrder(userId, request));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(
            @PathVariable String orderId,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(orderService.getOrder(orderId, userId));
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getUserOrders(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(orderService.getUserOrders(userId));
    }

    @DeleteMapping("/{orderId}")
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable String orderId,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(orderService.cancelOrder(orderId, userId));
    }

    @GetMapping("/seller")
    public ResponseEntity<List<OrderResponse>> getSellerOrders(
            @RequestHeader("X-Seller-Id") String sellerId,
            @RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(orderService.getSellerOrdersByStatus(sellerId, OrderStatus.valueOf(status.toUpperCase())));
        }
        return ResponseEntity.ok(orderService.getSellerOrders(sellerId));
    }

    @PatchMapping("/{orderId}/ship")
    public ResponseEntity<OrderResponse> markAsShipped(
            @PathVariable String orderId,
            @RequestHeader("X-Seller-Id") String sellerId) {
        return ResponseEntity.ok(orderService.markOrderAsShipped(orderId, sellerId));
    }

    @PatchMapping("/{orderId}/deliver")
    public ResponseEntity<OrderResponse> markAsDelivered(
            @PathVariable String orderId,
            @RequestHeader("X-Seller-Id") String sellerId) {
        return ResponseEntity.ok(orderService.markOrderAsDelivered(orderId, sellerId));
    }

    @GetMapping("/seller/stats")
    public ResponseEntity<SellerStatsResponse> getSellerStats(
            @RequestHeader("X-Seller-Id") String sellerId) {
        return ResponseEntity.ok(orderService.getSellerStats(sellerId));
    }
}