package com.kurilabo.portfolio.domain;

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
@Table(name = "media_asset")
public class MediaAsset {

    @Id
    private UUID id;

    @Column(name = "storage_provider", nullable = false)
    private String storageProvider;

    @Column(nullable = false)
    private String bucket;

    @Column(name = "object_key", nullable = false)
    private String objectKey;

    @Column(name = "original_filename")
    private String originalFilename;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "processing_status", nullable = false, columnDefinition = "media_processing_status")
    private MediaProcessingStatus processingStatus;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private AppUser uploadedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected MediaAsset() {
    }

    public MediaAsset(
            UUID id,
            String objectKey,
            String originalFilename,
            String contentType,
            long sizeBytes,
            AppUser uploadedBy,
            Instant createdAt
    ) {
        this.id = id;
        this.storageProvider = "LOCAL";
        this.bucket = "nail-sets";
        this.objectKey = objectKey;
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.processingStatus = MediaProcessingStatus.READY;
        this.uploadedBy = uploadedBy;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public String getObjectKey() { return objectKey; }
    public String getContentType() { return contentType; }
    public String getOriginalFilename() { return originalFilename; }
}
