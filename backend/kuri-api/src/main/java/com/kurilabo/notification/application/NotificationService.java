package com.kurilabo.notification.application;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.domain.UserRole;
import com.kurilabo.auth.domain.UserStatus;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.notification.api.NotificationResponse;
import com.kurilabo.notification.domain.Notification;
import com.kurilabo.notification.infrastructure.NotificationRepository;
import com.kurilabo.shared.error.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {
    private final NotificationRepository repository;
    private final AppUserRepository userRepository;
    private final Clock clock;

    public NotificationService(NotificationRepository repository, AppUserRepository userRepository, Clock clock) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(UUID userId) {
        return repository.findTop100ByUser_IdOrderByCreatedAtDesc(userId).stream().map(NotificationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(UUID userId) { return repository.countByUser_IdAndReadAtIsNull(userId); }

    @Transactional
    public NotificationResponse markRead(UUID userId, UUID notificationId) {
        Notification notification = repository.findByIdAndUser_Id(notificationId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification was not found."));
        notification.markRead(clock.instant());
        return NotificationResponse.from(notification);
    }

    @Transactional
    public void markAllRead(UUID userId) {
        var now = clock.instant();
        repository.findByUser_IdAndReadAtIsNull(userId).forEach(item -> item.markRead(now));
    }

    public void notifyUser(AppUser user, String type, String title, String message, UUID appointmentId) {
        repository.save(new Notification(user, type, title, message, appointmentId, clock.instant()));
    }

    public void notifyAdmins(String type, String title, String message, UUID appointmentId) {
        userRepository.findByRoleAndStatus(UserRole.ADMIN, UserStatus.ACTIVE)
                .forEach(admin -> notifyUser(admin, type, title, message, appointmentId));
    }
}
