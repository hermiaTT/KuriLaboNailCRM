package com.kurilabo.notification.domain;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.user.domain.Client;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification")
public class Notification {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id") private AppUser user;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "client_id") private Client client;
    @Column(nullable = false, length = 80) private String type;
    @Column(nullable = false, length = 160) private String title;
    @Column(nullable = false) private String message;
    @Column(name = "related_appointment_id") private UUID relatedAppointmentId;
    @Column(name = "related_client_id") private UUID relatedClientId;
    @Column(name = "read_at") private Instant readAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;

    protected Notification() {}
    public Notification(AppUser user, String type, String title, String message, UUID appointmentId, Instant now) {
        this(user, type, title, message, appointmentId, null, now);
    }
    public Notification(AppUser user, String type, String title, String message, UUID appointmentId,
                        UUID relatedClientId, Instant now) {
        this.id = UUID.randomUUID(); this.user = user; this.type = type; this.title = title; this.message = message;
        this.relatedAppointmentId = appointmentId; this.relatedClientId = relatedClientId; this.createdAt = now;
    }
    public Notification(Client client, String type, String title, String message, UUID appointmentId, Instant now) {
        this.id = UUID.randomUUID(); this.client = client; this.type = type; this.title = title; this.message = message;
        this.relatedAppointmentId = appointmentId; this.createdAt = now;
    }
    public UUID getId() { return id; }
    public AppUser getUser() { return user; }
    public Client getClient() { return client; }
    public String getType() { return type; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public UUID getRelatedAppointmentId() { return relatedAppointmentId; }
    public UUID getRelatedClientId() { return relatedClientId; }
    public Instant getReadAt() { return readAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void markRead(Instant now) { if (readAt == null) readAt = now; }
}
