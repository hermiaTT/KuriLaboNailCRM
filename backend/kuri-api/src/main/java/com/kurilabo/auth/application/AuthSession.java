package com.kurilabo.auth.application;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.user.domain.UserProfile;

public record AuthSession(
        AccessToken accessToken,
        String refreshToken,
        AppUser user,
        UserProfile profile
) {
}

