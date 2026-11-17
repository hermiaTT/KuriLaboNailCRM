package com.kurilabo.portfolio.domain;

import com.kurilabo.appointment.domain.Appointment;
import com.kurilabo.auth.domain.AppUser;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "nail_set")
public class NailSet {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private AppUser client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    private String title;
    private String description;

    @Column(nullable = false)
    private boolean published;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private AppUser createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "nailSet", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder asc")
    private List<NailSetMedia> media = new ArrayList<>();

    protected NailSet() {
    }

    public NailSet(
            UUID id,
            AppUser client,
            Appointment appointment,
            String title,
            String description,
            AppUser createdBy,
            Instant now
    ) {
        this.id = id;
        this.client = client;
        this.appointment = appointment;
        this.title = title;
        this.description = description;
        this.published = true;
        this.createdBy = createdBy;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void addMedia(MediaAsset asset, int displayOrder) {
        media.add(new NailSetMedia(UUID.randomUUID(), this, asset, displayOrder));
    }

    public void updateDetailsAndLink(
            AppUser client,
            Appointment appointment,
            String title,
            String description,
            Instant now
    ) {
        this.client = client;
        this.appointment = appointment;
        this.title = title;
        this.description = description;
        this.updatedAt = now;
    }

    public UUID getId() { return id; }
    public AppUser getClient() { return client; }
    public Appointment getAppointment() { return appointment; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Instant getCreatedAt() { return createdAt; }
    public List<NailSetMedia> getMedia() { return media; }
}
