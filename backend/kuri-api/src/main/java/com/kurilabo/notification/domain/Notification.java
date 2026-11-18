package com.kurilabo.notification.domain;

import com.kurilabo.auth.domain.AppUser;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification")
public class Notification {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;
    @Column(nullable = false, length = 80) private String type;
    @Column(nullable = false, length = 160) private String title;
    @Column(nullable = false) private String message;
    @Column(name = "related_appointment_id") private UUID relatedAppointmentId;
    @Column(name = "read_at") private Instant readAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;

    protected Notification() {}

    public Notification(AppUser user, String type, String title, String message, UUID appointmentId, Instant now) {
        this.id = UUID.randomUUID();
        this.user = user;
        this.type = type;
        this.title = title;
        this.message = message;
        this.relatedAppointmentId = appointmentId;
        this.createdAt = now;
    }

    public UUID getId() { return id; }
    public AppUser getUser() { return user; }
    public String getType() { return type; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public UUID getRelatedAppointmentId() { return relatedAppointmentId; }
    public Instant getReadAt() { return readAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void markRead(Instant now) { if (readAt == null) readAt = now; }
}
