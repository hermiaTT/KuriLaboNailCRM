package com.kurilabo.appointment.domain;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.servicecatalog.domain.ServiceDefinition;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "appointment")
public class Appointment {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private AppUser customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_definition_id")
    private ServiceDefinition serviceDefinition;

    @Column(name = "service_name_snapshot", nullable = false)
    private String serviceNameSnapshot;

    @Column(name = "duration_minutes_snapshot", nullable = false)
    private int durationMinutesSnapshot;

    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "end_at", nullable = false)
    private Instant endAt;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "appointment_status")
    private AppointmentStatus status;

    @Column(name = "customer_note")
    private String customerNote;

    @Column(name = "service_notes")
    private String serviceNotes;

    @Column(name = "final_price", precision = 10, scale = 2)
    private BigDecimal finalPrice;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private AppUser createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by")
    private AppUser confirmedBy;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    protected Appointment() {
    }

    public Appointment(
            UUID id,
            AppUser customer,
            ServiceDefinition serviceDefinition,
            Instant startAt,
            Instant endAt,
            String customerNote,
            AppUser createdBy
    ) {
        Instant now = Instant.now();
        this.id = id;
        this.customer = customer;
        this.serviceDefinition = serviceDefinition;
        this.serviceNameSnapshot = serviceDefinition.getName();
        this.durationMinutesSnapshot = serviceDefinition.getDurationMinutes();
        this.startAt = startAt;
        this.endAt = endAt;
        this.status = AppointmentStatus.PENDING_CONFIRMATION;
        this.customerNote = customerNote;
        this.createdBy = createdBy;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public Appointment(
            UUID id,
            AppUser customer,
            ServiceDefinition serviceDefinition,
            String serviceName,
            int durationMinutes,
            Instant startAt,
            Instant endAt,
            String customerNote,
            AppUser createdBy
    ) {
        Instant now = Instant.now();
        this.id = id;
        this.customer = customer;
        this.serviceDefinition = serviceDefinition;
        this.serviceNameSnapshot = serviceName;
        this.durationMinutesSnapshot = durationMinutes;
        this.startAt = startAt;
        this.endAt = endAt;
        this.status = AppointmentStatus.PENDING_CONFIRMATION;
        this.customerNote = customerNote;
        this.createdBy = createdBy;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void confirm(AppUser admin, Instant now) {
        requirePending();
        status = AppointmentStatus.CONFIRMED;
        confirmedBy = admin;
        confirmedAt = now;
        updatedAt = now;
    }

    public void reject(Instant now) {
        requirePending();
        status = AppointmentStatus.REJECTED;
        updatedAt = now;
    }

    public void requestCancellation(Instant now) {
        if (status != AppointmentStatus.CONFIRMED) {
            throw new IllegalStateException("Only a confirmed appointment can request cancellation.");
        }
        status = AppointmentStatus.CANCELLATION_REQUESTED;
        updatedAt = now;
    }

    public void approveCancellation(Instant now) {
        if (status != AppointmentStatus.CANCELLATION_REQUESTED) {
            throw new IllegalStateException("Appointment does not have a pending cancellation request.");
        }
        status = AppointmentStatus.CANCELLED;
        cancelledAt = now;
        updatedAt = now;
    }

    public void rejectCancellation(Instant now) {
        if (status != AppointmentStatus.CANCELLATION_REQUESTED) {
            throw new IllegalStateException("Appointment does not have a pending cancellation request.");
        }
        status = AppointmentStatus.CONFIRMED;
        updatedAt = now;
    }

    public void complete(Instant now) {
        requireConfirmed();
        status = AppointmentStatus.COMPLETED;
        completedAt = now;
        updatedAt = now;
    }

    public void markNoShow(Instant now) {
        requireConfirmed();
        status = AppointmentStatus.NO_SHOW;
        updatedAt = now;
    }

    public void updateVisitDetails(String serviceNotes, BigDecimal finalPrice, Instant now) {
        this.serviceNotes = serviceNotes;
        this.finalPrice = finalPrice;
        this.updatedAt = now;
    }

    public void recordCompleted(
            AppUser admin,
            String serviceNotes,
            BigDecimal finalPrice,
            Instant now
    ) {
        this.status = AppointmentStatus.COMPLETED;
        this.serviceNotes = serviceNotes;
        this.finalPrice = finalPrice;
        this.confirmedBy = admin;
        this.confirmedAt = now;
        this.completedAt = now;
        this.updatedAt = now;
    }

    private void requirePending() {
        if (status != AppointmentStatus.PENDING_CONFIRMATION) {
            throw new IllegalStateException("Only a pending appointment can be reviewed.");
        }
    }

    private void requireConfirmed() {
        if (status != AppointmentStatus.CONFIRMED) {
            throw new IllegalStateException("Only a confirmed appointment can be completed or marked no-show.");
        }
    }

    public UUID getId() {
        return id;
    }

    public AppUser getCustomer() {
        return customer;
    }

    public ServiceDefinition getServiceDefinition() {
        return serviceDefinition;
    }

    public String getServiceNameSnapshot() {
        return serviceNameSnapshot;
    }

    public int getDurationMinutesSnapshot() {
        return durationMinutesSnapshot;
    }

    public Instant getStartAt() {
        return startAt;
    }

    public Instant getEndAt() {
        return endAt;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public String getCustomerNote() {
        return customerNote;
    }

    public String getServiceNotes() {
        return serviceNotes;
    }

    public BigDecimal getFinalPrice() {
        return finalPrice;
    }
}

