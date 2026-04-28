package com.marketplace.order.domain.repository;

import com.marketplace.order.domain.model.Order;
import com.marketplace.order.domain.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, String> {

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    List<Order> findByUserId(String userId);

    List<Order> findByUserIdAndStatus(String userId, OrderStatus status);
}