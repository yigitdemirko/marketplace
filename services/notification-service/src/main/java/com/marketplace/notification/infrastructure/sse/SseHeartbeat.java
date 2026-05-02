package com.marketplace.notification.infrastructure.sse;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SseHeartbeat {

    private final NotificationStreamRegistry registry;

    @Scheduled(fixedDelayString = "${notifications.sse.heartbeat-ms:25000}")
    public void tick() {
        registry.heartbeat();
    }
}
