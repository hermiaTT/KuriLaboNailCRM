package com.kurilabo.user.api;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.user.domain.UserProfile;

import java.time.Instant;
import java.util.UUID;

public record AdminUserSummaryResponse(
        UUID id,
        String email,
        String role,
        String status,
        String name,
        String phone,
        Instant createdAt
) {
    public static AdminUserSummaryResponse from(AppUser user, UserProfile profile) {
        return new AdminUserSummaryResponse(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getStatus().name(),
                profile.getName(),
                profile.getPhone(),
                user.getCreatedAt()
        );
    }
}

