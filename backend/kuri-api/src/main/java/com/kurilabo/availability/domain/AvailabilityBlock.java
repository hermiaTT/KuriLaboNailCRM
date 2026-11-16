package com.kurilabo.availability.domain;

import com.kurilabo.auth.domain.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "availability_block")
public class AvailabilityBlock {

    @Id
    private UUID id;

    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "end_at", nullable = false)
    private Instant endAt;

    private String reason;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private AppUser createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AvailabilityBlock() {
    }

    public AvailabilityBlock(
            UUID id,
            Instant startAt,
            Instant endAt,
            String reason,
            AppUser createdBy,
            Instant createdAt
    ) {
        this.id = id;
        this.startAt = startAt;
        this.endAt = endAt;
        this.reason = reason;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public Instant getStartAt() {
        return startAt;
    }

    public Instant getEndAt() {
        return endAt;
    }

    public String getReason() {
        return reason;
    }

    public UUID getCreatedById() {
        return createdBy.getId();
    }
}

