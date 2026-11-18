package com.kurilabo.notification.infrastructure;

import com.kurilabo.notification.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findTop100ByUser_IdOrderByCreatedAtDesc(UUID userId);
    long countByUser_IdAndReadAtIsNull(UUID userId);
    Optional<Notification> findByIdAndUser_Id(UUID id, UUID userId);
    List<Notification> findByUser_IdAndReadAtIsNull(UUID userId);
}
