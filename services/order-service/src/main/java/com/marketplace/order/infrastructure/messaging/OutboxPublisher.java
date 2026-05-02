package com.marketplace.order.infrastructure.messaging;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.order.domain.model.OutboxEvent;
import com.marketplace.order.domain.repository.OutboxEventRepository;
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
public class OutboxPublisher {

    private static final int BATCH_SIZE = 50;
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Scheduled(fixedDelayString = "${app.outbox.poll-interval-ms:1000}")
    @Transactional
    public void publish() {
        List<OutboxEvent> batch = outboxEventRepository.findUnprocessed(PageRequest.of(0, BATCH_SIZE));
        if (batch.isEmpty()) return;

        for (OutboxEvent event : batch) {
            try {
                Map<String, Object> payload = objectMapper.readValue(event.getPayload(), MAP_TYPE);
                kafkaTemplate.send(event.getEventType(), event.getAggregateId(), payload).get();
                event.markProcessed();
                outboxEventRepository.save(event);
            } catch (Exception e) {
                log.error("Outbox publish failed: id={}, type={}", event.getId(), event.getEventType(), e);
                return;
            }
        }
        log.info("Outbox published {} events", batch.size());
    }
}
