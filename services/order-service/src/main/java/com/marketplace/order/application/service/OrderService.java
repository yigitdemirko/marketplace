package com.marketplace.order.application.service;

import com.marketplace.order.api.v1.dto.request.CreateOrderRequest;
import com.marketplace.order.api.v1.dto.response.OrderItemResponse;
import com.marketplace.order.api.v1.dto.response.OrderResponse;
import com.marketplace.order.domain.model.Order;
import com.marketplace.order.domain.model.OrderItem;
import com.marketplace.order.domain.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;

    @Transactional
    public OrderResponse createOrder(String userId, CreateOrderRequest request) {
        orderRepository.findByIdempotencyKey(request.idempotencyKey())
                .ifPresent(existing -> {
                    throw new RuntimeException("Order already exists with this idempotency key");
                });

        Order order = Order.create(userId, request.shippingAddress(), request.idempotencyKey());

        request.items().forEach(itemRequest -> {
            OrderItem item = OrderItem.create(
                    order,
                    itemRequest.productId(),
                    itemRequest.sellerId(),
                    itemRequest.quantity(),
                    itemRequest.unitPrice()
            );
            order.getItems().add(item);
        });

        order.calculateTotal();
        order.setStatus(com.marketplace.order.domain.model.OrderStatus.STOCK_RESERVING);

        Order saved = orderRepository.save(order);
        log.info("Order created: orderId={}, userId={}", saved.getId(), userId);

        return toResponse(saved);
    }

    public OrderResponse getOrder(String orderId, String userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        return toResponse(order);
    }

    public List<OrderResponse> getUserOrders(String userId) {
        return orderRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public OrderResponse cancelOrder(String orderId, String userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        order.cancel("Cancelled by user");
        return toResponse(orderRepository.save(order));
    }

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getId(),
                        item.getProductId(),
                        item.getSellerId(),
                        item.getQuantity(),
                        item.getUnitPrice()
                ))
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getUserId(),
                order.getStatus().name(),
                order.getTotalAmount(),
                order.getShippingAddress(),
                order.getIdempotencyKey(),
                items,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}