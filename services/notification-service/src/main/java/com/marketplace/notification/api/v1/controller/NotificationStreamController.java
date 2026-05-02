package com.marketplace.notification.api.v1.controller;

import com.marketplace.notification.infrastructure.sse.NotificationStreamRegistry;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications Stream", description = "Server-Sent Events stream for live notifications")
public class NotificationStreamController {

    private final NotificationStreamRegistry registry;

    @Value("${notifications.sse.timeout-ms:1800000}")
    private long sseTimeoutMs;

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(
            summary = "Subscribe to notification stream",
            description = "Server-Sent Events stream for live notifications. Each new notification is pushed " +
                    "as an event named `notification` with the notification JSON in `data`. Heartbeat comments " +
                    "every 25s keep the connection alive."
    )
    @SecurityRequirement(name = "cookieAuth")
    public SseEmitter stream(@RequestHeader("X-User-Id") String userId) throws IOException {
        SseEmitter emitter = registry.register(userId, sseTimeoutMs);
        emitter.send(SseEmitter.event().name("connected").data(""));
        return emitter;
    }
}
