package com.marketplace.notification.unit;

import com.marketplace.notification.infrastructure.sse.NotificationStreamRegistry;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import static org.assertj.core.api.Assertions.assertThat;

@Tag("unit")
class NotificationStreamRegistryTest {

    @Test
    void should_TrackEmitter_AndIncrementActiveUsers() {
        NotificationStreamRegistry registry = new NotificationStreamRegistry();

        SseEmitter emitter = registry.register("user-1", 60_000L);
        assertThat(emitter).isNotNull();
        assertThat(registry.activeUsers()).isEqualTo(1);

        registry.register("user-2", 60_000L);
        assertThat(registry.activeUsers()).isEqualTo(2);
    }

    @Test
    void should_PushToAllEmittersForUser_WithoutThrowingOnFailure() {
        NotificationStreamRegistry registry = new NotificationStreamRegistry();
        registry.register("user-1", 60_000L);
        registry.register("user-1", 60_000L);

        // Push should not throw even if emitters can't deliver in test context
        registry.push("user-1", "notification", "{\"id\":\"x\"}");
    }

    @Test
    void should_NoOp_When_PushingToUnknownUser() {
        NotificationStreamRegistry registry = new NotificationStreamRegistry();

        registry.push("ghost", "notification", "anything");
    }
}
