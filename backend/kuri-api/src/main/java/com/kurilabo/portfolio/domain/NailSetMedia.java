package com.kurilabo.portfolio.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "nail_set_media")
public class NailSetMedia {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "nail_set_id", nullable = false)
    private NailSet nailSet;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "media_asset_id", nullable = false)
    private MediaAsset mediaAsset;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    protected NailSetMedia() {
    }

    public NailSetMedia(UUID id, NailSet nailSet, MediaAsset mediaAsset, int displayOrder) {
        this.id = id;
        this.nailSet = nailSet;
        this.mediaAsset = mediaAsset;
        this.displayOrder = displayOrder;
    }

    public MediaAsset getMediaAsset() { return mediaAsset; }
    public int getDisplayOrder() { return displayOrder; }
}
