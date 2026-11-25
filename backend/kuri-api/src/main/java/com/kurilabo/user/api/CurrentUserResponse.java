package com.kurilabo.user.api;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.domain.UserRole;
import com.kurilabo.portfolio.domain.MediaAsset;
import com.kurilabo.user.domain.AdminProfile;
import com.kurilabo.user.domain.Client;

import java.time.LocalDate;
import java.util.UUID;

public record CurrentUserResponse(
        UUID id, UUID clientId, String email, String role, String name, String phone, String contactPhone,
        LocalDate birthday, String instagram, String wechat, String preferredNailStyle,
        String allergyNotes, String avatarUrl, String preferredLanguage
) {
    public static CurrentUserResponse from(AppUser user, Client client, AdminProfile adminProfile) {
        boolean admin = user.getRole() == UserRole.ADMIN;
        return new CurrentUserResponse(
                user.getId(), client == null ? null : client.getId(), user.getEmail(), user.getRole().name(),
                admin ? adminProfile.getName() : client.getClientName(), user.getLoginPhone(),
                client == null ? null : client.getContactPhone(), client == null ? null : client.getBirthday(),
                client == null ? null : client.getInstagram(), client == null ? null : client.getWechat(),
                client == null ? null : client.getPreferredNailStyle(), client == null ? null : client.getAllergyNotes(),
                avatarUrl(admin ? adminProfile.getAvatarMedia() : client.getAvatarMedia()),
                admin ? adminProfile.getPreferredLanguage() : client.getPreferredLanguage()
        );
    }

    private static String avatarUrl(MediaAsset media) {
        return media == null ? null : "/api/v1/media/" + media.getId() + "/content";
    }
}
