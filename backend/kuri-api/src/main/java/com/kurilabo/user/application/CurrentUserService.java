package com.kurilabo.user.application;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.shared.error.ApiException;
import com.kurilabo.user.api.CurrentUserResponse;
import com.kurilabo.user.domain.UserProfile;
import com.kurilabo.user.infrastructure.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class CurrentUserService {

    private final AppUserRepository userRepository;
    private final UserProfileRepository profileRepository;

    public CurrentUserService(AppUserRepository userRepository, UserProfileRepository profileRepository) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(UUID userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User no longer exists."));
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "User profile is missing."));
        return CurrentUserResponse.from(user, profile);
    }
}

