package com.marketplace.payment.domain.repository;

import com.marketplace.payment.domain.model.PaymentOutboxEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PaymentOutboxEventRepository extends JpaRepository<PaymentOutboxEvent, String> {

    @Query("SELECT e FROM PaymentOutboxEvent e WHERE e.processed = false ORDER BY e.createdAt ASC")
    List<PaymentOutboxEvent> findUnprocessed(Pageable pageable);
}
