package com.marketplace.order.unit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.order.domain.model.OutboxEvent;
import com.marketplace.order.domain.repository.OutboxEventRepository;
import com.marketplace.order.infrastructure.messaging.OutboxPublisher;
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
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class OutboxPublisherTest {

    @Mock
    private OutboxEventRepository repository;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private OutboxPublisher publisher;

    @Test
    void should_PublishUnprocessedEvents_AndMarkProcessed() {
        OutboxEvent event = OutboxEvent.create("order.created", "order-1", "{\"orderId\":\"order-1\"}");
        when(repository.findUnprocessed(any(Pageable.class))).thenReturn(List.of(event));
        when(kafkaTemplate.send(anyString(), anyString(), any()))
                .thenReturn(CompletableFuture.completedFuture(mock(SendResult.class)));

        publisher.publish();

        verify(kafkaTemplate).send("order.created", "order-1", java.util.Map.of("orderId", "order-1"));
        verify(repository).save(event);
        assertThat(event.isProcessed()).isTrue();
        assertThat(event.getProcessedAt()).isNotNull();
    }

    @Test
    void should_StopBatch_When_KafkaFails() {
        OutboxEvent first = OutboxEvent.create("order.created", "order-1", "{\"orderId\":\"order-1\"}");
        OutboxEvent second = OutboxEvent.create("order.created", "order-2", "{\"orderId\":\"order-2\"}");
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
