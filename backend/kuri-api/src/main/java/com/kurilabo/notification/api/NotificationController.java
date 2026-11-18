package com.kurilabo.notification.api;

import com.kurilabo.notification.application.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationService service;
    public NotificationController(NotificationService service) { this.service = service; }
    private UUID userId(JwtAuthenticationToken auth) { return UUID.fromString(auth.getToken().getSubject()); }

    @GetMapping public List<NotificationResponse> list(JwtAuthenticationToken auth) { return service.list(userId(auth)); }
    @GetMapping("/unread-count") public UnreadCountResponse count(JwtAuthenticationToken auth) { return new UnreadCountResponse(service.unreadCount(userId(auth))); }
    @PutMapping("/{id}/read") public NotificationResponse markRead(JwtAuthenticationToken auth, @PathVariable UUID id) { return service.markRead(userId(auth), id); }
    @PutMapping("/read-all") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(JwtAuthenticationToken auth) { service.markAllRead(userId(auth)); }
}
