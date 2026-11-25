package com.kurilabo.user.domain;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.portfolio.domain.MediaAsset;
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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "client")
public class Client {

    @Id
    private UUID id;

    @Column(name = "client_name", length = 120)
    private String clientName;

    @Column(name = "admin_display_name", nullable = false, length = 120)
    private String adminDisplayName;

    @Column(name = "contact_phone", length = 40)
    private String contactPhone;

    private LocalDate birthday;
    private String instagram;
    private String wechat;

    @Column(name = "preferred_language", nullable = false, length = 5)
    private String preferredLanguage = "en";

    @Column(name = "preferred_nail_style")
    private String preferredNailStyle;

    @Column(name = "allergy_notes")
    private String allergyNotes;

    @Column(name = "admin_notes")
    private String adminNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avatar_media_id")
    private MediaAsset avatarMedia;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "client_status")
    private ClientStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merged_into_client_id")
    private Client mergedIntoClient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merged_by")
    private AppUser mergedBy;

    @Column(name = "merged_at")
    private Instant mergedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Client() {}

    public Client(UUID id, String clientName, String adminDisplayName, String contactPhone, LocalDate birthday, Instant now) {
        this.id = id;
        this.clientName = blankToNull(clientName);
        this.adminDisplayName = adminDisplayName.trim();
        this.contactPhone = contactPhone;
        this.birthday = birthday;
        this.status = ClientStatus.ACTIVE;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public UUID getId() { return id; }
    public String getClientName() { return clientName; }
    public String getAdminDisplayName() { return adminDisplayName; }
    public String getContactPhone() { return contactPhone; }
    public LocalDate getBirthday() { return birthday; }
    public String getInstagram() { return instagram; }
    public String getWechat() { return wechat; }
    public String getPreferredLanguage() { return preferredLanguage; }
    public String getPreferredNailStyle() { return preferredNailStyle; }
    public String getAllergyNotes() { return allergyNotes; }
    public String getAdminNotes() { return adminNotes; }
    public MediaAsset getAvatarMedia() { return avatarMedia; }
    public ClientStatus getStatus() { return status; }
    public Client getMergedIntoClient() { return mergedIntoClient; }
    public Instant getCreatedAt() { return createdAt; }

    public void setAvatarMedia(MediaAsset avatarMedia, Instant now) {
        this.avatarMedia = avatarMedia;
        this.updatedAt = now;
    }

    public void setPreferredLanguage(String language, Instant now) {
        if (language != null) this.preferredLanguage = language;
        this.updatedAt = now;
    }

    public void updateByAdmin(
            String adminDisplayName,
            String contactPhone,
            LocalDate birthday,
            String instagram,
            String wechat,
            String preferredNailStyle,
            String allergyNotes,
            String adminNotes,
            Instant now
    ) {
        requireActive();
        this.adminDisplayName = adminDisplayName.trim();
        this.contactPhone = contactPhone;
        this.birthday = birthday;
        this.instagram = instagram;
        this.wechat = wechat;
        this.preferredNailStyle = preferredNailStyle;
        this.allergyNotes = allergyNotes;
        this.adminNotes = adminNotes;
        this.updatedAt = now;
    }

    public void updateByClient(
            String clientName,
            String contactPhone,
            LocalDate birthday,
            String instagram,
            String wechat,
            String preferredNailStyle,
            String allergyNotes,
            String preferredLanguage,
            Instant now
    ) {
        requireActive();
        this.clientName = clientName.trim();
        this.contactPhone = contactPhone;
        this.birthday = birthday;
        this.instagram = instagram;
        this.wechat = wechat;
        this.preferredNailStyle = preferredNailStyle;
        this.allergyNotes = allergyNotes;
        if (preferredLanguage != null) this.preferredLanguage = preferredLanguage;
        this.updatedAt = now;
    }

    public void claim(String clientName, String contactPhone, LocalDate birthday, Instant now) {
        requireActive();
        this.clientName = clientName.trim();
        this.contactPhone = contactPhone;
        if (birthday != null) this.birthday = birthday;
        this.updatedAt = now;
    }

    public void mergeMissingDetailsFrom(Client source, Instant now) {
        requireActive();
        if (isBlank(clientName)) clientName = source.clientName;
        if (isBlank(contactPhone)) contactPhone = source.contactPhone;
        if (birthday == null) birthday = source.birthday;
        if (isBlank(instagram)) instagram = source.instagram;
        if (isBlank(wechat)) wechat = source.wechat;
        if (isBlank(preferredNailStyle)) preferredNailStyle = source.preferredNailStyle;
        if (isBlank(allergyNotes)) allergyNotes = source.allergyNotes;
        if (!isBlank(source.adminNotes)) {
            adminNotes = isBlank(adminNotes) ? source.adminNotes : adminNotes + "\n\nMerged client notes:\n" + source.adminNotes;
        }
        updatedAt = now;
    }

    public void markMergedInto(Client target, AppUser admin, Instant now) {
        requireActive();
        if (id.equals(target.id)) throw new IllegalArgumentException("A client cannot be merged into itself.");
        status = ClientStatus.MERGED;
        mergedIntoClient = target;
        mergedBy = admin;
        mergedAt = now;
        updatedAt = now;
    }

    public void archive(Instant now) {
        requireActive();
        status = ClientStatus.ARCHIVED;
        updatedAt = now;
    }

    private void requireActive() {
        if (status != ClientStatus.ACTIVE) throw new IllegalStateException("Only active clients can be changed.");
    }

    private static String blankToNull(String value) { return isBlank(value) ? null : value.trim(); }
    private static boolean isBlank(String value) { return value == null || value.isBlank(); }
}
