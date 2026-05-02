package com.marketplace.payment.unit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.payment.domain.model.PaymentOutboxEvent;
import com.marketplace.payment.domain.repository.PaymentOutboxEventRepository;
import com.marketplace.payment.infrastructure.messaging.PaymentOutboxPublisher;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class PaymentOutboxPublisherTest {

    @Mock
    private PaymentOutboxEventRepository repository;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private PaymentOutboxPublisher publisher;

    @Test
    void should_PublishUnprocessedEvent_And_MarkProcessed() {
        PaymentOutboxEvent event = PaymentOutboxEvent.create(
                "payment.completed", "order-1",
                "{\"paymentId\":\"p1\",\"orderId\":\"order-1\",\"userId\":\"u1\",\"amount\":100}"
        );
        when(repository.findUnprocessed(any(Pageable.class))).thenReturn(List.of(event));
        when(kafkaTemplate.send(anyString(), anyString(), any()))
                .thenReturn(CompletableFuture.completedFuture(mock(SendResult.class)));

        publisher.publish();

        verify(kafkaTemplate).send("payment.completed", "order-1",
                Map.of("paymentId", "p1", "orderId", "order-1", "userId", "u1", "amount", 100));
        verify(repository).save(event);
        assertThat(event.isProcessed()).isTrue();
        assertThat(event.getProcessedAt()).isNotNull();
    }

    @Test
    void should_StopBatch_When_KafkaFails() {
        PaymentOutboxEvent first = PaymentOutboxEvent.create(
                "payment.completed", "order-1", "{\"orderId\":\"order-1\"}");
        PaymentOutboxEvent second = PaymentOutboxEvent.create(
                "payment.failed", "order-2", "{\"orderId\":\"order-2\"}");
        when(repository.findUnprocessed(any(Pageable.class))).thenReturn(List.of(first, second));

        CompletableFuture<SendResult<String, Object>> failed = new CompletableFuture<>();
        failed.completeExceptionally(new RuntimeException("kafka down"));
        when(kafkaTemplate.send(anyString(), anyString(), any())).thenReturn(failed);

        publisher.publish();

        assertThat(first.isProcessed()).isFalse();
        assertThat(second.isProcessed()).isFalse();
        verify(repository, never()).save(any());
    }

    @Test
    void should_DoNothing_When_NoUnprocessedEvents() {
        when(repository.findUnprocessed(any(Pageable.class))).thenReturn(List.of());

        publisher.publish();

        verifyNoInteractions(kafkaTemplate);
    }
}
