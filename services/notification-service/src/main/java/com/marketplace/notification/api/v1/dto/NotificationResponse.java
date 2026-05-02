package com.marketplace.notification.api.v1.dto;

import com.marketplace.notification.domain.model.Notification;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        Notification.Type type,
        String title,
        String body,
        String link,
        boolean read,
        Instant createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(), n.getType(), n.getTitle(), n.getBody(),
                n.getLink(), n.isRead(), n.getCreatedAt()
        );
    }
}
