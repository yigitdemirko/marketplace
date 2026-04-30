package com.marketplace.payment.application.service;

import com.iyzipay.model.PaymentCard;
import com.marketplace.payment.api.v1.dto.request.ProcessPaymentRequest;
import com.marketplace.payment.api.v1.dto.response.PaymentResponse;
import com.marketplace.payment.domain.model.Payment;
import com.marketplace.payment.domain.repository.PaymentRepository;
import com.marketplace.payment.infrastructure.client.OrderClient;
import com.marketplace.payment.infrastructure.client.OrderSummary;
import com.marketplace.payment.infrastructure.iyzico.IyzicoPaymentService;
import com.marketplace.payment.infrastructure.messaging.PaymentEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final Set<String> PAYABLE_STATUSES = Set.of("PAYMENT_PENDING", "STOCK_RESERVING");

    private final PaymentRepository paymentRepository;
    private final IyzicoPaymentService iyzicoPaymentService;
    private final PaymentEventPublisher eventPublisher;
    private final OrderClient orderClient;

    @Transactional
    public PaymentResponse processPayment(String userId, ProcessPaymentRequest request) {
        paymentRepository.findByIdempotencyKey(request.idempotencyKey())
                .ifPresent(existing -> {
                    throw new RuntimeException("Payment already processed");
                });

        OrderSummary order = orderClient.getOrder(request.orderId(), userId);
        if (!PAYABLE_STATUSES.contains(order.status())) {
            throw new RuntimeException("Order is not payable in status: " + order.status());
        }
        BigDecimal amount = order.totalAmount();

        Payment payment = Payment.create(
                request.orderId(),
                userId,
                amount,
                request.idempotencyKey()
        );

        PaymentCard paymentCard = new PaymentCard();
        paymentCard.setCardHolderName(request.cardHolderName());
        paymentCard.setCardNumber(request.cardNumber());
        paymentCard.setExpireMonth(request.expireMonth());
        paymentCard.setExpireYear(request.expireYear());
        paymentCard.setCvc(request.cvc());

        try {
            com.iyzipay.model.Payment result = iyzicoPaymentService.processPayment(
                    request.orderId(),
                    userId,
                    amount,
                    paymentCard
            );

            if ("success".equals(result.getStatus())) {
                payment.complete(result.getPaymentId());
                paymentRepository.save(payment);
                eventPublisher.publishPaymentCompleted(payment);
            } else {
                payment.fail(result.getErrorMessage());
                paymentRepository.save(payment);
                eventPublisher.publishPaymentFailed(payment);
            }
        } catch (Exception e) {
            payment.fail(e.getMessage());
            paymentRepository.save(payment);
            eventPublisher.publishPaymentFailed(payment);
            log.error("Payment error: orderId={}", request.orderId(), e);
        }

        return toResponse(payment);
    }

    public PaymentResponse getPaymentByOrderId(String orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        return toResponse(payment);
    }

    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrderId(),
                payment.getUserId(),
                payment.getAmount(),
                payment.getStatus().name(),
                payment.getIdempotencyKey(),
                payment.getIyzicoPaymentId(),
                payment.getFailureReason(),
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );
    }
}