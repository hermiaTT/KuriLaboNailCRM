package com.kurilabo.user.api;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.user.domain.UserProfile;

import java.time.LocalDate;
import java.util.UUID;

public record CurrentUserResponse(
        UUID id,
        String email,
        String role,
        String name,
        String phone,
        LocalDate birthday,
        String instagram,
        String wechat,
        String preferredNailStyle,
        String allergyNotes
) {
    public static CurrentUserResponse from(AppUser user, UserProfile profile) {
        return new CurrentUserResponse(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                profile.getName(),
                profile.getPhone(),
                profile.getBirthday(),
                profile.getInstagram(),
                profile.getWechat(),
                profile.getPreferredNailStyle(),
                profile.getAllergyNotes()
        );
    }
}

