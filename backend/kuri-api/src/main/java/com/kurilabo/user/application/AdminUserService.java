package com.kurilabo.user.application;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.domain.UserRole;
import com.kurilabo.auth.domain.UserStatus;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.shared.error.ApiException;
import com.kurilabo.user.api.AdminUpdateUserRequest;
import com.kurilabo.user.api.AdminUserDetailResponse;
import com.kurilabo.user.api.AdminUserSummaryResponse;
import com.kurilabo.user.domain.UserProfile;
import com.kurilabo.user.infrastructure.UserProfileRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

@Service
public class AdminUserService {

    private final AppUserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final Clock clock;

    public AdminUserService(
            AppUserRepository userRepository,
            UserProfileRepository profileRepository,
            Clock clock
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<AdminUserSummaryResponse> getAll() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(user -> AdminUserSummaryResponse.from(user, getProfile(user.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminUserDetailResponse get(UUID userId) {
        AppUser user = getUser(userId);
        return AdminUserDetailResponse.from(user, getProfile(userId));
    }

    @Transactional
    public AdminUserDetailResponse update(
            UUID actingAdminId,
            UUID userId,
            AdminUpdateUserRequest request
    ) {
        if (actingAdminId.equals(userId)
                && (request.role() != UserRole.ADMIN || request.status() != UserStatus.ACTIVE)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "You cannot deactivate or remove your own admin access"
            );
        }

        AppUser user = getUser(userId);
        UserProfile profile = getProfile(userId);
        var now = clock.instant();
        user.updateAccess(request.role(), request.status(), now);
        profile.updateByAdmin(
                request.name().trim(),
                normalizeOptional(request.phone()),
                request.birthday(),
                normalizeOptional(request.instagram()),
                normalizeOptional(request.wechat()),
                normalizeOptional(request.preferredNailStyle()),
                normalizeOptional(request.allergyNotes()),
                normalizeOptional(request.adminNotes()),
                now
        );
        return AdminUserDetailResponse.from(user, profile);
    }

    private AppUser getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private UserProfile getProfile(UUID userId) {
        return profileRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User profile not found"));
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
