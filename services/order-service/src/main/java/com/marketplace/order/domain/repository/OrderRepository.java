package com.marketplace.order.domain.repository;

import com.marketplace.order.domain.model.Order;
import com.marketplace.order.domain.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, String> {

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    List<Order> findByUserId(String userId);

    List<Order> findByUserIdAndStatus(String userId, OrderStatus status);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.items i WHERE i.sellerId = :sellerId ORDER BY o.createdAt DESC")
    List<Order> findBySellerIdOrderByCreatedAtDesc(@Param("sellerId") String sellerId);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.items i WHERE i.sellerId = :sellerId AND o.status = :status ORDER BY o.createdAt DESC")
    List<Order> findBySellerIdAndStatusOrderByCreatedAtDesc(@Param("sellerId") String sellerId, @Param("status") OrderStatus status);

    List<Order> findByStatus(OrderStatus status);
}