package com.kurilabo.appointment.domain;

import com.kurilabo.portfolio.domain.MediaAsset;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Column;

import java.util.UUID;

@Entity
@Table(name = "appointment_reference_media")
public class AppointmentReferenceMedia {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "media_asset_id", nullable = false)
    private MediaAsset mediaAsset;
    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    protected AppointmentReferenceMedia() {}

    public AppointmentReferenceMedia(UUID id, Appointment appointment, MediaAsset mediaAsset, int displayOrder) {
        this.id = id;
        this.appointment = appointment;
        this.mediaAsset = mediaAsset;
        this.displayOrder = displayOrder;
    }

    public UUID getId() { return id; }
    public MediaAsset getMediaAsset() { return mediaAsset; }
    public int getDisplayOrder() { return displayOrder; }
}
