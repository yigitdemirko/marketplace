package com.marketplace.order.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "order_items")
@Getter
@Setter
public class OrderItem {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private String productId;

    @Column(nullable = false)
    private String sellerId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private BigDecimal unitPrice;

    public static OrderItem create(Order order, String productId, String sellerId,
                                   Integer quantity, BigDecimal unitPrice) {
        OrderItem item = new OrderItem();
        item.id = UUID.randomUUID().toString();
        item.order = order;
        item.productId = productId;
        item.sellerId = sellerId;
        item.quantity = quantity;
        item.unitPrice = unitPrice;
        return item;
    }
}