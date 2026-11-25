package com.kurilabo.auth.application;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.user.domain.AdminProfile;
import com.kurilabo.user.domain.Client;

public record AuthSession(
        AccessToken accessToken,
        String refreshToken,
        AppUser user,
        Client client,
        AdminProfile adminProfile
) {
}

