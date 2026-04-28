package com.marketplace.payment.domain.repository;

import com.marketplace.payment.domain.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, String> {

    Optional<Payment> findByIdempotencyKey(String idempotencyKey);

    Optional<Payment> findByOrderId(String orderId);
}