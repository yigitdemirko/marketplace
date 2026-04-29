package com.marketplace.payment.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Getter
@Setter
public class Payment {

    @Id
    private String id;

    @Column(nullable = false)
    private String orderId;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    @Column(nullable = false, unique = true)
    private String idempotencyKey;

    private String iyzicoPaymentId;
    private String failureReason;

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


    public static Payment create(String orderId, String userId,
                                 BigDecimal amount, String idempotencyKey) {
        Payment payment = new Payment();
        payment.id = UUID.randomUUID().toString();
        payment.orderId = orderId;
        payment.userId = userId;
        payment.amount = amount;
        payment.idempotencyKey = idempotencyKey;
        payment.status = PaymentStatus.PENDING;
        payment.createdAt = LocalDateTime.now();
        payment.updatedAt = LocalDateTime.now();
        return payment;
    }

    public void complete(String iyzicoPaymentId) {
        this.status = PaymentStatus.COMPLETED;
        this.iyzicoPaymentId = iyzicoPaymentId;
    }

    public void fail(String reason) {
        this.status = PaymentStatus.FAILED;
        this.failureReason = reason;
    }
}