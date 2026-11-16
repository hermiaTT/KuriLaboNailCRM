package com.kurilabo.appointment.domain;

import com.kurilabo.auth.domain.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "cancellation_request")
public class CancellationRequest {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requested_by", nullable = false)
    private AppUser requestedBy;

    private String reason;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "cancellation_request_status")
    private CancellationRequestStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private AppUser reviewedBy;

    @Column(name = "review_note")
    private String reviewNote;

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    protected CancellationRequest() {
    }

    public CancellationRequest(Appointment appointment, AppUser requestedBy, String reason, Instant now) {
        this.id = UUID.randomUUID();
        this.appointment = appointment;
        this.requestedBy = requestedBy;
        this.reason = reason;
        this.status = CancellationRequestStatus.PENDING;
        this.requestedAt = now;
    }

    public void approve(AppUser admin, String note, Instant now) {
        requirePending();
        status = CancellationRequestStatus.APPROVED;
        reviewedBy = admin;
        reviewNote = note;
        reviewedAt = now;
    }

    public void reject(AppUser admin, String note, Instant now) {
        requirePending();
        status = CancellationRequestStatus.REJECTED;
        reviewedBy = admin;
        reviewNote = note;
        reviewedAt = now;
    }

    private void requirePending() {
        if (status != CancellationRequestStatus.PENDING) {
            throw new IllegalStateException("Cancellation request has already been reviewed.");
        }
    }
}

