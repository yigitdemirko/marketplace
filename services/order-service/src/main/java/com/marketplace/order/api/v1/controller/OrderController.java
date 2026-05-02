package com.marketplace.order.api.v1.controller;

import com.marketplace.order.api.v1.dto.request.CreateOrderRequest;
import com.marketplace.order.api.v1.dto.response.OrderResponse;
import com.marketplace.order.api.v1.dto.response.SellerStatsResponse;
import com.marketplace.order.application.service.OrderService;
import com.marketplace.order.domain.model.OrderStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order lifecycle management — create, track, cancel, and ship orders")
@SecurityRequirement(name = "cookieAuth")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(
            summary = "Create order",
            description = "Validates products with catalog-service, reserves stock, and starts the Saga. " +
                          "Prices are server-authoritative — client-supplied unitPrice is ignored."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Order created, saga started"),
            @ApiResponse(responseCode = "400", description = "Invalid request, product unavailable, or insufficient stock"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "409", description = "Duplicate idempotency key")
    })
    public ResponseEntity<OrderResponse> createOrder(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.createOrder(userId, request));
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get order by ID", description = "Buyers can only retrieve their own orders.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order found"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    public ResponseEntity<OrderResponse> getOrder(
            @PathVariable String orderId,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(orderService.getOrder(orderId, userId));
    }

    @GetMapping
    @Operation(summary = "List my orders", description = "Returns all orders for the authenticated buyer, newest first.")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    public ResponseEntity<List<OrderResponse>> getUserOrders(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(orderService.getUserOrders(userId));
    }

    @DeleteMapping("/{orderId}")
    @Operation(
            summary = "Cancel order",
            description = "Cancels a PAYMENT_PENDING or STOCK_RESERVING order. Publishes order.cancelled event " +
                          "to trigger stock release via Saga."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order cancelled"),
            @ApiResponse(responseCode = "400", description = "Order is in a non-cancellable status"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable String orderId,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(orderService.cancelOrder(orderId, userId));
    }

    @GetMapping("/seller")
    @Operation(
            summary = "List seller orders",
            description = "Returns orders containing items sold by the authenticated seller. " +
                          "Optionally filter by status (STOCK_RESERVING, PAYMENT_PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED)."
    )
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    public ResponseEntity<List<OrderResponse>> getSellerOrders(
            @RequestHeader("X-Seller-Id") String sellerId,
            @RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(orderService.getSellerOrdersByStatus(sellerId, OrderStatus.valueOf(status.toUpperCase())));
        }
        return ResponseEntity.ok(orderService.getSellerOrders(sellerId));
    }

    @PatchMapping("/{orderId}/ship")
    @Operation(summary = "Mark order as shipped", description = "Seller marks a CONFIRMED order as shipped.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Status updated to SHIPPED"),
            @ApiResponse(responseCode = "400", description = "Order is not in CONFIRMED status"),
            @ApiResponse(responseCode = "401", description = "Not authenticated or not the seller"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    public ResponseEntity<OrderResponse> markAsShipped(
            @PathVariable String orderId,
            @RequestHeader("X-Seller-Id") String sellerId) {
        return ResponseEntity.ok(orderService.markOrderAsShipped(orderId, sellerId));
    }

    @PatchMapping("/{orderId}/deliver")
    @Operation(summary = "Mark order as delivered", description = "Seller manually marks a SHIPPED order as delivered.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Status updated to DELIVERED"),
            @ApiResponse(responseCode = "401", description = "Not authenticated or not the seller"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    public ResponseEntity<OrderResponse> markAsDelivered(
            @PathVariable String orderId,
            @RequestHeader("X-Seller-Id") String sellerId) {
        return ResponseEntity.ok(orderService.markOrderAsDelivered(orderId, sellerId));
    }

    @GetMapping("/seller/stats")
    @Operation(summary = "Get seller order stats", description = "Returns total orders, gross revenue, and pending shipment count for the seller.")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    public ResponseEntity<SellerStatsResponse> getSellerStats(
            @RequestHeader("X-Seller-Id") String sellerId) {
        return ResponseEntity.ok(orderService.getSellerStats(sellerId));
    }
}
