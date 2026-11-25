package com.kurilabo.notification.infrastructure;

import com.kurilabo.notification.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findTop100ByUser_IdOrderByCreatedAtDesc(UUID userId);
    List<Notification> findTop100ByClient_IdOrderByCreatedAtDesc(UUID clientId);
    long countByUser_IdAndReadAtIsNull(UUID userId);
    long countByClient_IdAndReadAtIsNull(UUID clientId);
    Optional<Notification> findByIdAndUser_Id(UUID id, UUID userId);
    Optional<Notification> findByIdAndClient_Id(UUID id, UUID clientId);
    List<Notification> findByUser_IdAndReadAtIsNull(UUID userId);
    List<Notification> findByClient_IdAndReadAtIsNull(UUID clientId);
}
