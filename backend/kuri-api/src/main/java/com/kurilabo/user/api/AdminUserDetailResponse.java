package com.kurilabo.user.api;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.user.domain.Client;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AdminUserDetailResponse(
        UUID id, UUID accountId, String email, String accountType, String role,
        String name, String clientName, String adminDisplayName, String phone, String loginPhone,
        LocalDate birthday, String instagram, String wechat, String preferredNailStyle,
        String allergyNotes, String adminNotes, String avatarUrl, Instant createdAt
) {
    public static AdminUserDetailResponse from(Client client, AppUser account) {
        boolean registered = account != null;
        return new AdminUserDetailResponse(client.getId(), registered ? account.getId() : null,
                registered ? account.getEmail() : null, registered ? "REGISTERED" : "GUEST", "USER",
                client.getAdminDisplayName(),
                client.getClientName(), client.getAdminDisplayName(), client.getContactPhone(),
                registered ? account.getLoginPhone() : null, client.getBirthday(), client.getInstagram(),
                client.getWechat(), client.getPreferredNailStyle(), client.getAllergyNotes(), client.getAdminNotes(),
                client.getAvatarMedia() == null ? null : "/api/v1/media/" + client.getAvatarMedia().getId() + "/content",
                client.getCreatedAt());
    }
}
