package com.kurilabo.user.api;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.user.domain.Client;

import java.time.Instant;
import java.util.UUID;

public record AdminUserSummaryResponse(
        UUID id, UUID accountId, String email, String accountType, String role,
        String name, String clientName, String adminDisplayName, String phone, String loginPhone,
        Instant nextAppointmentAt, Instant createdAt
) {
    public static AdminUserSummaryResponse from(Client client, AppUser account, Instant nextAppointmentAt) {
        boolean registered = account != null;
        return new AdminUserSummaryResponse(client.getId(), registered ? account.getId() : null,
                registered ? account.getEmail() : null, registered ? "REGISTERED" : "GUEST", "USER",
                client.getAdminDisplayName(),
                client.getClientName(), client.getAdminDisplayName(), client.getContactPhone(),
                registered ? account.getLoginPhone() : null, nextAppointmentAt, client.getCreatedAt());
    }
}
