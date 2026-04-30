package com.marketplace.order.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Getter
@Setter
public class Order {

    @Id
    private String id;

    @Column(nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @Column(nullable = false, unique = true)
    private String idempotencyKey;

    private String shippingAddress;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<OrderItem> items = new ArrayList<>();

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public static Order create(String userId, String shippingAddress, String idempotencyKey) {
        Order order = new Order();
        order.id = UUID.randomUUID().toString();
        order.userId = userId;
        order.status = OrderStatus.PENDING;
        order.totalAmount = BigDecimal.ZERO;
        order.shippingAddress = shippingAddress;
        order.idempotencyKey = idempotencyKey;
        order.createdAt = LocalDateTime.now();
        order.updatedAt = LocalDateTime.now();
        return order;
    }

    public void confirmStock() {
        if (this.status != OrderStatus.STOCK_RESERVING) {
            throw new RuntimeException("Invalid status transition");
        }
        this.status = OrderStatus.PAYMENT_PENDING;
    }

    public void confirmPayment() {
        if (this.status != OrderStatus.PAYMENT_PENDING) {
            throw new RuntimeException("Invalid status transition");
        }
        this.status = OrderStatus.CONFIRMED;
    }

    public void markAsShipped() {
        if (this.status != OrderStatus.CONFIRMED) {
            throw new RuntimeException("Order must be CONFIRMED to mark as shipped");
        }
        this.status = OrderStatus.SHIPPED;
    }

    public void markAsDelivered() {
        if (this.status != OrderStatus.SHIPPED) {
            throw new RuntimeException("Order must be SHIPPED to mark as delivered");
        }
        this.status = OrderStatus.DELIVERED;
    }

    public void cancel(String reason) {
        if (this.status == OrderStatus.CONFIRMED || this.status == OrderStatus.SHIPPED || this.status == OrderStatus.DELIVERED) {
            throw new RuntimeException("Order cannot be cancelled");
        }
        this.status = OrderStatus.CANCELLED;
    }

    public void calculateTotal() {
        this.totalAmount = items.stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}