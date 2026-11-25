package com.kurilabo.auth.api;

import com.kurilabo.auth.application.AuthSession;
import com.kurilabo.auth.domain.UserRole;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AuthResponse(
        String accessToken,
        Instant accessTokenExpiresAt,
        String refreshToken,
        UserSummary user
) {
    public static AuthResponse from(AuthSession session, boolean includeRefreshToken) {
        return new AuthResponse(
                session.accessToken().value(),
                session.accessToken().expiresAt(),
                includeRefreshToken ? session.refreshToken() : null,
                new UserSummary(
                        session.user().getId(),
                        session.user().getEmail(),
                        session.user().getRole().name(),
                        session.client() == null ? null : session.client().getId(),
                        session.user().getRole() == UserRole.ADMIN ? session.adminProfile().getName() : session.client().getClientName(),
                        session.user().getLoginPhone(),
                        session.client() == null ? null : session.client().getContactPhone(),
                        session.client() == null ? null : session.client().getBirthday(),
                        session.user().getRole() == UserRole.ADMIN ? session.adminProfile().getPreferredLanguage() : session.client().getPreferredLanguage()
                )
        );
    }

    public record UserSummary(
            UUID id,
            String email,
            String role,
            UUID clientId,
            String name,
            String phone,
            String contactPhone,
            LocalDate birthday,
            String preferredLanguage
    ) {
    }
}

