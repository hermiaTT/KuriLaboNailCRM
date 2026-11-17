package com.kurilabo.user.application;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.domain.AccountType;
import com.kurilabo.auth.domain.UserRole;
import com.kurilabo.auth.domain.UserStatus;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.shared.error.ApiException;
import com.kurilabo.shared.phone.PhoneNumberNormalizer;
import com.kurilabo.user.api.AdminUpdateUserRequest;
import com.kurilabo.user.api.AdminUserDetailResponse;
import com.kurilabo.user.api.AdminUserSummaryResponse;
import com.kurilabo.user.api.CreateGuestClientRequest;
import com.kurilabo.outbox.domain.OutboxEvent;
import com.kurilabo.outbox.infrastructure.OutboxEventRepository;
import com.kurilabo.user.domain.UserProfile;
import com.kurilabo.user.infrastructure.UserProfileRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;
import java.util.UUID;
import java.util.Map;

@Service
public class AdminUserService {

    private final AppUserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final Clock clock;
    private final OutboxEventRepository outboxEventRepository;

    public AdminUserService(
            AppUserRepository userRepository,
            UserProfileRepository profileRepository,
            Clock clock,
            OutboxEventRepository outboxEventRepository
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.clock = clock;
        this.outboxEventRepository = outboxEventRepository;
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
    public AdminUserDetailResponse createGuest(UUID actingAdminId, CreateGuestClientRequest request) {
        AppUser admin = getUser(actingAdminId);
        UUID clientId = UUID.randomUUID();
        AppUser guest = AppUser.guest(clientId);
        String phone = normalizePhone(request.phone());
        if (profileRepository.existsByPhone(phone)) {
            throw new ApiException(HttpStatus.CONFLICT, "A client with this phone number already exists.");
        }
        UserProfile profile = new UserProfile(
                clientId,
                request.name().trim(),
                phone,
                null
        );
        userRepository.save(guest);
        profileRepository.save(profile);
        outboxEventRepository.save(new OutboxEvent(
                "Client",
                clientId,
                "GuestClientCreatedV1",
                Map.of(
                        "clientId", clientId.toString(),
                        "createdBy", admin.getId().toString(),
                        "accountType", AccountType.GUEST.name()
                ),
                clock.instant()
        ));
        return AdminUserDetailResponse.from(guest, profile);
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
        if (user.getAccountType() == AccountType.GUEST && request.role() != UserRole.USER) {
            throw new ApiException(HttpStatus.CONFLICT, "Guest clients cannot be granted account access. Merge them with a registered user instead.");
        }
        UserProfile profile = getProfile(userId);
        String phone = normalizePhone(request.phone());
        if (profileRepository.existsByPhoneAndUserIdNot(phone, userId)) {
            throw new ApiException(HttpStatus.CONFLICT, "This phone number is already used by another client.");
        }
        var now = clock.instant();
        user.updateAccess(request.role(), request.status(), now);
        profile.updateByAdmin(
                request.name().trim(),
                phone,
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

    private String normalizePhone(String value) {
        try {
            return PhoneNumberNormalizer.normalize(value);
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }
}
