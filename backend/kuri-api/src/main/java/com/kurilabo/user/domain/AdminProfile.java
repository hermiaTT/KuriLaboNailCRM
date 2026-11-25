package com.kurilabo.user.domain;

import com.kurilabo.portfolio.domain.MediaAsset;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "admin_profile")
public class AdminProfile {
    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false, length = 120)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avatar_media_id")
    private MediaAsset avatarMedia;

    @Column(name = "preferred_language", nullable = false, length = 5)
    private String preferredLanguage = "en";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AdminProfile() {}

    public AdminProfile(UUID userId, String name, Instant now) {
        this.userId = userId;
        this.name = name.trim();
        this.createdAt = now;
        this.updatedAt = now;
    }

    public String getName() { return name; }
    public MediaAsset getAvatarMedia() { return avatarMedia; }
    public String getPreferredLanguage() { return preferredLanguage; }

    public void update(String name, String preferredLanguage, Instant now) {
        this.name = name.trim();
        if (preferredLanguage != null) this.preferredLanguage = preferredLanguage;
        this.updatedAt = now;
    }

    public void setAvatarMedia(MediaAsset avatarMedia, Instant now) {
        this.avatarMedia = avatarMedia;
        this.updatedAt = now;
    }
}
