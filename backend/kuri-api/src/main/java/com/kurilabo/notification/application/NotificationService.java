package com.kurilabo.notification.application;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.domain.UserRole;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.notification.api.NotificationResponse;
import com.kurilabo.notification.domain.Notification;
import com.kurilabo.notification.infrastructure.NotificationRepository;
import com.kurilabo.shared.error.ApiException;
import com.kurilabo.user.domain.Client;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {
    private final NotificationRepository repository;
    private final AppUserRepository users;
    private final Clock clock;

    public NotificationService(NotificationRepository repository, AppUserRepository users, Clock clock) {
        this.repository = repository; this.users = users; this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(UUID userId) {
        AppUser user = getUser(userId);
        return (user.getRole() == UserRole.USER
                ? repository.findTop100ByClient_IdOrderByCreatedAtDesc(requireClient(user).getId())
                : repository.findTop100ByUser_IdOrderByCreatedAtDesc(userId))
                .stream().map(NotificationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(UUID userId) {
        AppUser user = getUser(userId);
        return user.getRole() == UserRole.USER
                ? repository.countByClient_IdAndReadAtIsNull(requireClient(user).getId())
                : repository.countByUser_IdAndReadAtIsNull(userId);
    }

    @Transactional
    public NotificationResponse markRead(UUID userId, UUID notificationId) {
        AppUser user = getUser(userId);
        Notification notification = (user.getRole() == UserRole.USER
                ? repository.findByIdAndClient_Id(notificationId, requireClient(user).getId())
                : repository.findByIdAndUser_Id(notificationId, userId))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification was not found."));
        notification.markRead(clock.instant());
        return NotificationResponse.from(notification);
    }

    @Transactional
    public void markAllRead(UUID userId) {
        AppUser user = getUser(userId);
        var items = user.getRole() == UserRole.USER
                ? repository.findByClient_IdAndReadAtIsNull(requireClient(user).getId())
                : repository.findByUser_IdAndReadAtIsNull(userId);
        var now = clock.instant();
        items.forEach(item -> item.markRead(now));
    }

    public void notifyUser(AppUser user, String type, String title, String message, UUID appointmentId) {
        repository.save(new Notification(user, type, title, message, appointmentId, clock.instant()));
    }
    public void notifyClient(Client client, String type, String title, String message, UUID appointmentId) {
        repository.save(new Notification(client, type, title, message, appointmentId, clock.instant()));
    }
    public void notifyAdmins(String type, String title, String message, UUID appointmentId) {
        users.findByRole(UserRole.ADMIN)
                .forEach(admin -> notifyUser(admin, type, title, message, appointmentId));
    }
    public void notifyAdminsForClient(String type, String title, String message, UUID clientId) {
        users.findByRole(UserRole.ADMIN)
                .forEach(admin -> repository.save(new Notification(
                        admin, type, title, message, null, clientId, clock.instant()
                )));
    }
    private AppUser getUser(UUID id) { return users.findById(id).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User no longer exists.")); }
    private Client requireClient(AppUser user) {
        if (user.getClient() == null) throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Client link is missing.");
        return user.getClient();
    }
}
