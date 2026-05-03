package com.marketplace.payment.unit;

import com.iyzipay.model.Payment;
import com.marketplace.common.exception.BadRequestException;
import com.marketplace.common.exception.ConflictException;
import com.marketplace.common.exception.NotFoundException;
import com.marketplace.payment.api.v1.dto.request.ProcessPaymentRequest;
import com.marketplace.payment.api.v1.dto.response.PaymentResponse;
import com.marketplace.payment.application.service.PaymentService;
import com.marketplace.payment.domain.model.PaymentStatus;
import com.marketplace.payment.domain.repository.PaymentRepository;
import com.marketplace.payment.infrastructure.client.OrderServiceGateway;
import com.marketplace.payment.infrastructure.client.OrderSummary;
import com.marketplace.payment.infrastructure.iyzico.IyzicoGateway;
import com.marketplace.payment.infrastructure.messaging.PaymentEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private IyzicoGateway iyzicoGateway;

    @Mock
    private PaymentEventPublisher eventPublisher;

    @Mock
    private OrderServiceGateway orderServiceGateway;

    @InjectMocks
    private PaymentService paymentService;

    @BeforeEach
    void setMaxAmount() {
        ReflectionTestUtils.setField(paymentService, "maxAmount", new BigDecimal("100000"));
    }

    private ProcessPaymentRequest sampleRequest(String idempotencyKey) {
        return new ProcessPaymentRequest(
                "order-001", idempotencyKey, "Test User", "5528790000000008",
                "12", "2030", "123"
        );
    }

    @Test
    void should_ProcessPayment_UsingOrderDerivedAmount() {
        ProcessPaymentRequest request = sampleRequest("idem-pay-001");

        OrderSummary order = new OrderSummary("order-001", "user-123", "PAYMENT_PENDING", BigDecimal.valueOf(199.98));
        when(orderServiceGateway.getOrder(eq("order-001"), eq("user-123"))).thenReturn(order);

        Payment mockIyzicoPayment = mock(Payment.class);
        when(mockIyzicoPayment.getStatus()).thenReturn("success");

        when(paymentRepository.findByIdempotencyKey(anyString())).thenReturn(Optional.empty());
        when(iyzicoGateway.processPayment(anyString(), anyString(), any(), any()))
                .thenReturn(mockIyzicoPayment);
        when(paymentRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        PaymentResponse response = paymentService.processPayment("user-123", request);

        assertThat(response.status()).isEqualTo(PaymentStatus.COMPLETED.name());
        assertThat(response.orderId()).isEqualTo("order-001");
        assertThat(response.amount()).isEqualByComparingTo(BigDecimal.valueOf(199.98));

        ArgumentCaptor<BigDecimal> amountCaptor = ArgumentCaptor.forClass(BigDecimal.class);
        verify(iyzicoGateway).processPayment(eq("order-001"), eq("user-123"), amountCaptor.capture(), any());
        assertThat(amountCaptor.getValue()).isEqualByComparingTo(BigDecimal.valueOf(199.98));
        verify(eventPublisher).publishPaymentCompleted(any());
    }

    @Test
    void should_FailPayment_When_IyzicoFails() {
        ProcessPaymentRequest request = sampleRequest("idem-pay-002");

        OrderSummary order = new OrderSummary("order-001", "user-123", "PAYMENT_PENDING", BigDecimal.valueOf(99.99));
        when(orderServiceGateway.getOrder(eq("order-001"), eq("user-123"))).thenReturn(order);

        Payment mockIyzicoPayment = mock(Payment.class);
        when(mockIyzicoPayment.getStatus()).thenReturn("failure");

        when(paymentRepository.findByIdempotencyKey(anyString())).thenReturn(Optional.empty());
        when(iyzicoGateway.processPayment(anyString(), anyString(), any(), any()))
                .thenReturn(mockIyzicoPayment);
        when(paymentRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        PaymentResponse response = paymentService.processPayment("user-123", request);

        assertThat(response.status()).isEqualTo(PaymentStatus.FAILED.name());
        verify(eventPublisher).publishPaymentFailed(any());
    }

    @Test
    void should_RejectPayment_When_OrderNotPayable() {
        ProcessPaymentRequest request = sampleRequest("idem-pay-003");

        OrderSummary order = new OrderSummary("order-001", "user-123", "CONFIRMED", BigDecimal.valueOf(99.99));
        when(paymentRepository.findByIdempotencyKey(anyString())).thenReturn(Optional.empty());
        when(orderServiceGateway.getOrder(eq("order-001"), eq("user-123"))).thenReturn(order);

        assertThatThrownBy(() -> paymentService.processPayment("user-123", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("ödenemez");

        verify(iyzicoGateway, never()).processPayment(anyString(), anyString(), any(), any());
        verify(eventPublisher, never()).publishPaymentCompleted(any());
        verify(eventPublisher, never()).publishPaymentFailed(any());
    }

    @Test
    void should_ThrowException_When_IdempotencyKeyExists() {
        ProcessPaymentRequest request = sampleRequest("idem-pay-001");

        com.marketplace.payment.domain.model.Payment existing =
                com.marketplace.payment.domain.model.Payment.create(
                        "order-001", "user-123", BigDecimal.valueOf(99.99), "idem-pay-001"
                );

        when(paymentRepository.findByIdempotencyKey(anyString())).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> paymentService.processPayment("user-123", request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Bu ödeme zaten işlenmiş");

        verify(orderServiceGateway, never()).getOrder(anyString(), anyString());
    }

    @Test
    void should_ThrowException_When_PaymentNotFound() {
        when(paymentRepository.findByOrderId(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.getPaymentByOrderId("non-existent"))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Ödeme bulunamadı");
    }
}
