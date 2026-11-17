package com.kurilabo.auth.api;

import com.kurilabo.auth.application.AuthSession;

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
                        session.profile().getName(),
                        session.profile().getPhone(),
                        session.profile().getBirthday()
                )
        );
    }

    public record UserSummary(
            UUID id,
            String email,
            String role,
            String name,
            String phone,
            LocalDate birthday
    ) {
    }
}

