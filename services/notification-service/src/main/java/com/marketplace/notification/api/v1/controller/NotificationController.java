package com.marketplace.notification.api.v1.controller;

import com.marketplace.notification.api.v1.dto.NotificationResponse;
import com.marketplace.notification.api.v1.dto.UnreadCountResponse;
import com.marketplace.notification.application.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notification inbox + SSE live stream")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "List notifications for current user")
    @SecurityRequirement(name = "cookieAuth")
    public ResponseEntity<Page<NotificationResponse>> list(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(name = "unread", defaultValue = "false") boolean unreadOnly,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(notificationService.list(userId, unreadOnly, pageable).map(NotificationResponse::from));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Unread notification count for current user")
    @SecurityRequirement(name = "cookieAuth")
    public ResponseEntity<UnreadCountResponse> unreadCount(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(new UnreadCountResponse(notificationService.unreadCount(userId)));
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    @SecurityRequirement(name = "cookieAuth")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Marked read"),
            @ApiResponse(responseCode = "403", description = "Not the owner")
    })
    public ResponseEntity<Void> markRead(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable UUID id) {
        notificationService.markRead(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    @Operation(summary = "Mark all current user's notifications as read")
    @SecurityRequirement(name = "cookieAuth")
    public ResponseEntity<Void> markAllRead(@RequestHeader("X-User-Id") String userId) {
        notificationService.markAllRead(userId);
        return ResponseEntity.noContent().build();
    }
}
