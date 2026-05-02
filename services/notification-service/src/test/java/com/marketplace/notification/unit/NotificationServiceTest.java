package com.marketplace.notification.unit;

import com.marketplace.notification.application.service.NotificationService;
import com.marketplace.notification.domain.model.Notification;
import com.marketplace.notification.domain.repository.NotificationRepository;
import com.marketplace.notification.infrastructure.sse.NotificationStreamRegistry;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository repository;

    @Mock
    private NotificationStreamRegistry streamRegistry;

    @InjectMocks
    private NotificationService service;

    @Test
    void should_PersistAndPushToStream_WhenCreated() {
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Notification saved = service.create("user-1", Notification.Type.ORDER_CREATED,
                "Order received", "Body", "/orders/abc");

        assertThat(saved.getUserId()).isEqualTo("user-1");
        assertThat(saved.getType()).isEqualTo(Notification.Type.ORDER_CREATED);
        assertThat(saved.isRead()).isFalse();
        verify(repository).save(any(Notification.class));
        verify(streamRegistry).push(eq("user-1"), eq("notification"), any());
    }

    @Test
    void should_RejectMarkRead_When_NotOwner() {
        UUID id = UUID.randomUUID();
        Notification owned = Notification.create("owner", Notification.Type.ORDER_CREATED, "t", "b", null);
        when(repository.findById(id)).thenReturn(Optional.of(owned));

        assertThatThrownBy(() -> service.markRead("attacker", id))
                .isInstanceOf(SecurityException.class);

        verify(repository, never()).save(any());
    }

    @Test
    void should_NoOpMarkRead_When_AlreadyRead() {
        UUID id = UUID.randomUUID();
        Notification read = Notification.create("user-1", Notification.Type.ORDER_CREATED, "t", "b", null);
        read.setRead(true);
        when(repository.findById(id)).thenReturn(Optional.of(read));

        service.markRead("user-1", id);

        verify(repository, never()).save(any());
    }

    @Test
    void should_PersistMarkRead_When_OwnerAndUnread() {
        UUID id = UUID.randomUUID();
        Notification unread = Notification.create("user-1", Notification.Type.ORDER_CREATED, "t", "b", null);
        when(repository.findById(id)).thenReturn(Optional.of(unread));

        service.markRead("user-1", id);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().isRead()).isTrue();
    }

    @Test
    void should_DelegateMarkAllRead() {
        when(repository.markAllReadForUser("user-1")).thenReturn(7);

        int count = service.markAllRead("user-1");

        assertThat(count).isEqualTo(7);
    }

    @Test
    void should_DelegateUnreadCount() {
        when(repository.countByUserIdAndReadFalse(anyString())).thenReturn(3L);

        assertThat(service.unreadCount("user-1")).isEqualTo(3);
    }
}
