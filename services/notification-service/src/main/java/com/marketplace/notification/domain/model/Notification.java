package com.marketplace.notification.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    public enum Type {
        ORDER_CREATED,
        PAYMENT_COMPLETED,
        PAYMENT_FAILED,
        ORDER_CANCELLED
    }

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Type type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 1000)
    private String body;

    @Column(length = 500)
    private String link;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public static Notification create(String userId, Type type, String title, String body, String link) {
        return Notification.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .type(type)
                .title(title)
                .body(body)
                .link(link)
                .read(false)
                .createdAt(Instant.now())
                .build();
    }
}
