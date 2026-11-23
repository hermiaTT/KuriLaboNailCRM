package com.kurilabo.user.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import com.kurilabo.portfolio.domain.MediaAsset;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "user_profile")
public class UserProfile {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false, length = 120)
    private String name;

    private String phone;
    private LocalDate birthday;
    private String instagram;
    private String wechat;

    @Column(name = "preferred_nail_style")
    private String preferredNailStyle;

    @Column(name = "allergy_notes")
    private String allergyNotes;

    @Column(name = "admin_notes")
    private String adminNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avatar_media_id")
    private MediaAsset avatarMedia;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserProfile() {
    }

    public UserProfile(UUID userId, String name, String phone, LocalDate birthday) {
        Instant now = Instant.now();
        this.userId = userId;
        this.name = name;
        this.phone = phone;
        this.birthday = birthday;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public String getPhone() {
        return phone;
    }

    public LocalDate getBirthday() {
        return birthday;
    }

    public String getInstagram() {
        return instagram;
    }

    public String getWechat() {
        return wechat;
    }

    public String getPreferredNailStyle() {
        return preferredNailStyle;
    }

    public String getAllergyNotes() {
        return allergyNotes;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public MediaAsset getAvatarMedia() { return avatarMedia; }
    public void setAvatarMedia(MediaAsset avatarMedia, Instant now) {
        this.avatarMedia = avatarMedia;
        this.updatedAt = now;
    }

    public void updateByAdmin(
            String name,
            String phone,
            LocalDate birthday,
            String instagram,
            String wechat,
            String preferredNailStyle,
            String allergyNotes,
            String adminNotes,
            Instant now
    ) {
        this.name = name;
        this.phone = phone;
        this.birthday = birthday;
        this.instagram = instagram;
        this.wechat = wechat;
        this.preferredNailStyle = preferredNailStyle;
        this.allergyNotes = allergyNotes;
        this.adminNotes = adminNotes;
        this.updatedAt = now;
    }

    public void updateByUser(
            String name,
            String phone,
            LocalDate birthday,
            String instagram,
            String wechat,
            String preferredNailStyle,
            String allergyNotes,
            Instant now
    ) {
        this.name = name;
        this.phone = phone;
        this.birthday = birthday;
        this.instagram = instagram;
        this.wechat = wechat;
        this.preferredNailStyle = preferredNailStyle;
        this.allergyNotes = allergyNotes;
        this.updatedAt = now;
    }

    public void mergeMissingDetailsFrom(UserProfile guest, Instant now) {
        if (birthday == null) birthday = guest.birthday;
        if (isBlank(instagram)) instagram = guest.instagram;
        if (isBlank(wechat)) wechat = guest.wechat;
        if (isBlank(preferredNailStyle)) preferredNailStyle = guest.preferredNailStyle;
        if (isBlank(allergyNotes)) allergyNotes = guest.allergyNotes;
        if (!isBlank(guest.adminNotes)) {
            adminNotes = isBlank(adminNotes) ? guest.adminNotes : adminNotes + "\n\nMerged guest notes:\n" + guest.adminNotes;
        }
        updatedAt = now;
    }

    private boolean isBlank(String value) { return value == null || value.isBlank(); }
}

