package com.kurilabo.outbox.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "outbox_event")
public class OutboxEvent {

    @Id
    private UUID id;

    @Column(name = "aggregate_type", nullable = false)
    private String aggregateType;

    @Column(name = "aggregate_id", nullable = false)
    private UUID aggregateId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "event_version", nullable = false)
    private int eventVersion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> payload;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "publish_attempts", nullable = false)
    private int publishAttempts;

    protected OutboxEvent() {
    }

    public OutboxEvent(UUID aggregateId, String eventType, Map<String, Object> payload, Instant occurredAt) {
        this("Appointment", aggregateId, eventType, payload, occurredAt);
    }

    public OutboxEvent(
            String aggregateType,
            UUID aggregateId,
            String eventType,
            Map<String, Object> payload,
            Instant occurredAt
    ) {
        this.id = UUID.randomUUID();
        this.aggregateType = aggregateType;
        this.aggregateId = aggregateId;
        this.eventType = eventType;
        this.eventVersion = 1;
        this.payload = payload;
        this.occurredAt = occurredAt;
        this.publishAttempts = 0;
    }
}

