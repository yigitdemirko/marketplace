package com.marketplace.payment.infrastructure.iyzico;

import com.iyzipay.model.Payment;
import com.iyzipay.model.PaymentCard;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Slf4j
@Component
@RequiredArgsConstructor
public class IyzicoGateway {

    private final IyzicoPaymentService iyzicoPaymentService;

    @CircuitBreaker(name = "iyzico", fallbackMethod = "payFallback")
    public Payment processPayment(String orderId, String userId,
                                  BigDecimal amount, PaymentCard paymentCard) {
        return iyzicoPaymentService.processPayment(orderId, userId, amount, paymentCard);
    }

    @SuppressWarnings("unused")
    private Payment payFallback(String orderId, String userId,
                                BigDecimal amount, PaymentCard paymentCard, Throwable t) {
        log.warn("Iyzico circuit open or call failed for orderId={}: {}", orderId, t.getMessage());
        throw new IyzicoUnavailableException(
                "Payment provider unavailable, please retry shortly", t);
    }
}
