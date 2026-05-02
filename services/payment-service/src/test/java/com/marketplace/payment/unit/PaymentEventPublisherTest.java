package com.marketplace.payment.unit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.payment.domain.model.Payment;
import com.marketplace.payment.domain.model.PaymentOutboxEvent;
import com.marketplace.payment.domain.repository.PaymentOutboxEventRepository;
import com.marketplace.payment.infrastructure.messaging.PaymentEventPublisher;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class PaymentEventPublisherTest {

    @Mock
    private PaymentOutboxEventRepository outboxRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private PaymentEventPublisher publisher;

    @Test
    void should_WriteOutboxRow_When_PaymentCompleted() {
        Payment payment = Payment.create("order-1", "u1", new BigDecimal("250.00"), "idem-1");
        payment.complete("iyzico-tx-1");

        publisher.publishPaymentCompleted(payment);

        ArgumentCaptor<PaymentOutboxEvent> captor = ArgumentCaptor.forClass(PaymentOutboxEvent.class);
        verify(outboxRepository).save(captor.capture());

        PaymentOutboxEvent saved = captor.getValue();
        assertThat(saved.getEventType()).isEqualTo("payment.completed");
        assertThat(saved.getAggregateId()).isEqualTo("order-1");
        assertThat(saved.getPayload())
                .contains("\"paymentId\"")
                .contains("\"orderId\":\"order-1\"")
                .contains("\"userId\":\"u1\"")
                .contains("\"amount\":250.00");
        assertThat(saved.isProcessed()).isFalse();
    }

    @Test
    void should_WriteOutboxRow_With_Reason_When_PaymentFailed() {
        Payment payment = Payment.create("order-2", "u1", new BigDecimal("100"), "idem-2");
        payment.fail("Insufficient funds");

        publisher.publishPaymentFailed(payment);

        ArgumentCaptor<PaymentOutboxEvent> captor = ArgumentCaptor.forClass(PaymentOutboxEvent.class);
        verify(outboxRepository).save(captor.capture());

        PaymentOutboxEvent saved = captor.getValue();
        assertThat(saved.getEventType()).isEqualTo("payment.failed");
        assertThat(saved.getAggregateId()).isEqualTo("order-2");
        assertThat(saved.getPayload())
                .contains("\"reason\":\"Insufficient funds\"")
                .contains("\"orderId\":\"order-2\"");
    }
}
