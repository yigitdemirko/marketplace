package com.marketplace.notification.infrastructure.sse;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
public class NotificationStreamRegistry {

    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emittersByUser = new ConcurrentHashMap<>();

    public SseEmitter register(String userId, long timeoutMs) {
        SseEmitter emitter = new SseEmitter(timeoutMs);
        CopyOnWriteArrayList<SseEmitter> list = emittersByUser.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>());
        list.add(emitter);

        Runnable remove = () -> {
            list.remove(emitter);
            if (list.isEmpty()) {
                emittersByUser.remove(userId, list);
            }
        };
        emitter.onCompletion(remove);
        emitter.onTimeout(remove);
        emitter.onError(t -> remove.run());
        log.debug("SSE emitter registered for userId={} (active for user: {})", userId, list.size());
        return emitter;
    }

    public void push(String userId, String eventName, Object payload) {
        List<SseEmitter> list = emittersByUser.get(userId);
        if (list == null || list.isEmpty()) {
            return;
        }
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(payload));
            } catch (IOException | IllegalStateException e) {
                log.debug("SSE push failed for userId={}: {}", userId, e.getMessage());
                emitter.completeWithError(e);
            }
        }
    }

    public void heartbeat() {
        emittersByUser.forEach((userId, list) -> {
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (IOException | IllegalStateException e) {
                    emitter.completeWithError(e);
                }
            }
        });
    }

    public int activeUsers() {
        return emittersByUser.size();
    }
}
