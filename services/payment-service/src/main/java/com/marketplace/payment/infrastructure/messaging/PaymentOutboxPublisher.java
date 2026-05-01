package com.marketplace.payment.infrastructure.messaging;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.payment.domain.model.PaymentOutboxEvent;
import com.marketplace.payment.domain.repository.PaymentOutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentOutboxPublisher {

    private static final int BATCH_SIZE = 50;
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final PaymentOutboxEventRepository outboxRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Scheduled(fixedDelayString = "${app.outbox.poll-interval-ms:1000}")
    @Transactional
    public void publish() {
        List<PaymentOutboxEvent> batch = outboxRepository.findUnprocessed(PageRequest.of(0, BATCH_SIZE));
        if (batch.isEmpty()) return;

        for (PaymentOutboxEvent event : batch) {
            try {
                Map<String, Object> payload = objectMapper.readValue(event.getPayload(), MAP_TYPE);
                kafkaTemplate.send(event.getEventType(), event.getAggregateId(), payload).get();
                event.markProcessed();
                outboxRepository.save(event);
            } catch (Exception e) {
                log.error("Outbox publish failed: id={}, type={}", event.getId(), event.getEventType(), e);
                return;
            }
        }
        log.debug("Payment outbox published {} events", batch.size());
    }
}
