package com.kurilabo.user.api;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.user.domain.UserProfile;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AdminUserDetailResponse(
        UUID id,
        String email,
        String role,
        String status,
        String name,
        String phone,
        LocalDate birthday,
        String instagram,
        String wechat,
        String preferredNailStyle,
        String allergyNotes,
        String adminNotes,
        Instant createdAt
) {
    public static AdminUserDetailResponse from(AppUser user, UserProfile profile) {
        return new AdminUserDetailResponse(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getStatus().name(),
                profile.getName(),
                profile.getPhone(),
                profile.getBirthday(),
                profile.getInstagram(),
                profile.getWechat(),
                profile.getPreferredNailStyle(),
                profile.getAllergyNotes(),
                profile.getAdminNotes(),
                user.getCreatedAt()
        );
    }
}

