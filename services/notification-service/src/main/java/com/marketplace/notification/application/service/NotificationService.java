package com.marketplace.notification.application.service;

import com.marketplace.notification.api.v1.dto.NotificationResponse;
import com.marketplace.notification.domain.model.Notification;
import com.marketplace.notification.domain.repository.NotificationRepository;
import com.marketplace.notification.infrastructure.sse.NotificationStreamRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repository;
    private final NotificationStreamRegistry streamRegistry;

    @Transactional
    public Notification create(String userId, Notification.Type type, String title, String body, String link) {
        Notification saved = repository.save(Notification.create(userId, type, title, body, link));
        streamRegistry.push(userId, "notification", NotificationResponse.from(saved));
        log.info("Notification created: userId={} type={} id={}", userId, type, saved.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public Page<Notification> list(String userId, boolean unreadOnly, Pageable pageable) {
        return unreadOnly
                ? repository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId, pageable)
                : repository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public long unreadCount(String userId) {
        return repository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markRead(String userId, UUID notificationId) {
        repository.findById(notificationId).ifPresent(n -> {
            if (!n.getUserId().equals(userId)) {
                throw new SecurityException("Not the owner of this notification");
            }
            if (!n.isRead()) {
                n.setRead(true);
                repository.save(n);
            }
        });
    }

    @Transactional
    public int markAllRead(String userId) {
        return repository.markAllReadForUser(userId);
    }
}
