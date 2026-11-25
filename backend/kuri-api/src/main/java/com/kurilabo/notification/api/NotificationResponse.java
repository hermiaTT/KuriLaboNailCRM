package com.kurilabo.notification.api;

import com.kurilabo.notification.domain.Notification;
import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(UUID id, String type, String title, String message,
                                   UUID appointmentId, UUID clientId, boolean read, Instant createdAt) {
    public static NotificationResponse from(Notification value) {
        return new NotificationResponse(value.getId(), value.getType(), value.getTitle(), value.getMessage(),
                value.getRelatedAppointmentId(), value.getRelatedClientId(),
                value.getReadAt() != null, value.getCreatedAt());
    }
}
