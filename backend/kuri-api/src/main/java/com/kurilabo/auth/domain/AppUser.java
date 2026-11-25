package com.kurilabo.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import com.kurilabo.user.domain.Client;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "app_user")
public class AppUser {

    @Id
    private UUID id;

    @Column(unique = true, columnDefinition = "citext")
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "login_phone", nullable = false, unique = true, length = 40)
    private String loginPhone;

    @Column(name = "phone_verified_at")
    private Instant phoneVerifiedAt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", unique = true)
    private Client client;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "user_role")
    private UserRole role;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AppUser() {
    }

    public AppUser(UUID id, String email, String passwordHash, String loginPhone, UserRole role, Client client) {
        Instant now = Instant.now();
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.loginPhone = loginPhone;
        this.client = client;
        this.role = role;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public UUID getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getLoginPhone() { return loginPhone; }
    public Instant getPhoneVerifiedAt() { return phoneVerifiedAt; }
    public Client getClient() { return client; }

    public UserRole getRole() {
        return role;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void updatePassword(String passwordHash, Instant now) {
        this.passwordHash = passwordHash;
        this.updatedAt = now;
    }

    public void updateLoginPhone(String loginPhone, Instant now) {
        this.loginPhone = loginPhone;
        this.phoneVerifiedAt = null;
        this.updatedAt = now;
    }

    public void markPhoneVerified(Instant now) {
        this.phoneVerifiedAt = now;
        this.updatedAt = now;
    }

    public void linkClient(Client client, Instant now) {
        if (role != UserRole.USER) throw new IllegalStateException("Only client accounts can link to a client record.");
        this.client = client;
        this.updatedAt = now;
    }
}

