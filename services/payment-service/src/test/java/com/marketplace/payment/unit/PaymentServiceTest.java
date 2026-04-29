package com.marketplace.payment.unit;

import com.iyzipay.model.Payment;
import com.marketplace.payment.api.v1.dto.request.ProcessPaymentRequest;
import com.marketplace.payment.api.v1.dto.response.PaymentResponse;
import com.marketplace.payment.application.service.PaymentService;
import com.marketplace.payment.domain.model.PaymentStatus;
import com.marketplace.payment.domain.repository.PaymentRepository;
import com.marketplace.payment.infrastructure.iyzico.IyzicoPaymentService;
import com.marketplace.payment.infrastructure.messaging.PaymentEventPublisher;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private IyzicoPaymentService iyzicoPaymentService;

    @Mock
    private PaymentEventPublisher eventPublisher;

    @InjectMocks
    private PaymentService paymentService;

    @Test
    void should_ProcessPayment_Successfully() {
        ProcessPaymentRequest request = new ProcessPaymentRequest(
                "order-001", "user-123", BigDecimal.valueOf(99.99),
                "idem-pay-001", "Test User", "5528790000000008",
                "12", "2030", "123"
        );

        Payment mockIyzicoPayment = mock(Payment.class);
        when(mockIyzicoPayment.getStatus()).thenReturn("success");

        when(paymentRepository.findByIdempotencyKey(anyString())).thenReturn(Optional.empty());
        when(iyzicoPaymentService.processPayment(anyString(), anyString(), any(), any()))
                .thenReturn(mockIyzicoPayment);
        when(paymentRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        PaymentResponse response = paymentService.processPayment(request);

        assertThat(response.status()).isEqualTo(PaymentStatus.COMPLETED.name());
        assertThat(response.orderId()).isEqualTo("order-001");
        verify(eventPublisher).publishPaymentCompleted(any());
    }

    @Test
    void should_FailPayment_When_IyzicoFails() {
        ProcessPaymentRequest request = new ProcessPaymentRequest(
                "order-001", "user-123", BigDecimal.valueOf(99.99),
                "idem-pay-002", "Test User", "5528790000000008",
                "12", "2030", "123"
        );

        Payment mockIyzicoPayment = mock(Payment.class);
        when(mockIyzicoPayment.getStatus()).thenReturn("failure");

        when(paymentRepository.findByIdempotencyKey(anyString())).thenReturn(Optional.empty());
        when(iyzicoPaymentService.processPayment(anyString(), anyString(), any(), any()))
                .thenReturn(mockIyzicoPayment);
        when(paymentRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        PaymentResponse response = paymentService.processPayment(request);

        assertThat(response.status()).isEqualTo(PaymentStatus.FAILED.name());
        verify(eventPublisher).publishPaymentFailed(any());
    }

    @Test
    void should_ThrowException_When_IdempotencyKeyExists() {
        ProcessPaymentRequest request = new ProcessPaymentRequest(
                "order-001", "user-123", BigDecimal.valueOf(99.99),
                "idem-pay-001", "Test User", "5528790000000008",
                "12", "2030", "123"
        );

        com.marketplace.payment.domain.model.Payment existing =
                com.marketplace.payment.domain.model.Payment.create(
                        "order-001", "user-123", BigDecimal.valueOf(99.99), "idem-pay-001"
                );

        when(paymentRepository.findByIdempotencyKey(anyString())).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> paymentService.processPayment(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Payment already processed");
    }

    @Test
    void should_ThrowException_When_PaymentNotFound() {
        when(paymentRepository.findByOrderId(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.getPaymentByOrderId("non-existent"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Payment not found");
    }
}
