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
import com.kurilabo.user.api.MergeGuestClientRequest;
import com.kurilabo.outbox.domain.OutboxEvent;
import com.kurilabo.outbox.infrastructure.OutboxEventRepository;
import com.kurilabo.user.domain.UserProfile;
import com.kurilabo.user.infrastructure.UserProfileRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.persistence.EntityManager;

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
    private final JdbcTemplate jdbcTemplate;
    private final EntityManager entityManager;

    public AdminUserService(
            AppUserRepository userRepository,
            UserProfileRepository profileRepository,
            Clock clock,
            OutboxEventRepository outboxEventRepository,
            JdbcTemplate jdbcTemplate,
            EntityManager entityManager
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.clock = clock;
        this.outboxEventRepository = outboxEventRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.entityManager = entityManager;
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
        String name = request.name().trim();
        if (profileRepository.existsByNameIgnoreCase(name)) {
            throw new ApiException(HttpStatus.CONFLICT, "A client with this name already exists.");
        }
        String phone = normalizeOptionalPhone(request.phone());
        if (phone != null && profileRepository.existsByPhone(phone)) {
            throw new ApiException(HttpStatus.CONFLICT, "A client with this phone number already exists.");
        }
        UserProfile profile = new UserProfile(
                clientId,
                name,
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
        String name = request.name().trim();
        if (profileRepository.existsByNameIgnoreCaseAndUserIdNot(name, userId)) {
            throw new ApiException(HttpStatus.CONFLICT, "A client with this name already exists.");
        }
        String phone = normalizeOptionalPhone(request.phone());
        if (user.getAccountType() == AccountType.REGISTERED && phone == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Registered clients need a phone number for sign-in.");
        }
        if (phone != null && profileRepository.existsByPhoneAndUserIdNot(phone, userId)) {
            throw new ApiException(HttpStatus.CONFLICT, "This phone number is already used by another client.");
        }
        var now = clock.instant();
        user.updateAccess(request.role(), request.status(), now);
        profile.updateByAdmin(
                name,
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

    @Transactional
    public AdminUserDetailResponse mergeGuest(UUID actingAdminId, UUID guestId, MergeGuestClientRequest request) {
        AppUser admin = getUser(actingAdminId);
        AppUser guest = getUser(guestId);
        AppUser target = getUser(request.targetUserId());
        if (guestId.equals(target.getId())) throw new ApiException(HttpStatus.BAD_REQUEST, "Choose a different registered client.");
        if (guest.getAccountType() != AccountType.GUEST) throw new ApiException(HttpStatus.CONFLICT, "Only guest clients can be merged.");
        if (target.getAccountType() != AccountType.REGISTERED || target.getRole() != UserRole.USER) {
            throw new ApiException(HttpStatus.CONFLICT, "The merge target must be a registered client.");
        }

        UserProfile guestProfile = getProfile(guestId);
        UserProfile targetProfile = getProfile(target.getId());
        targetProfile.mergeMissingDetailsFrom(guestProfile, clock.instant());
        entityManager.flush();

        jdbcTemplate.update("update appointment set customer_id = ? where customer_id = ?", target.getId(), guestId);
        jdbcTemplate.update("update nail_set set client_id = ? where client_id = ?", target.getId(), guestId);
        jdbcTemplate.update("update collection_item set customer_id = ? where customer_id = ?", target.getId(), guestId);
        jdbcTemplate.update("update notification set user_id = ? where user_id = ?", target.getId(), guestId);
        jdbcTemplate.update("insert into nail_set_favorite(user_id, nail_set_id, created_at) select ?, nail_set_id, created_at from nail_set_favorite where user_id = ? on conflict do nothing", target.getId(), guestId);
        jdbcTemplate.update("delete from nail_set_favorite where user_id = ?", guestId);
        jdbcTemplate.update("insert into inspiration_favorite(user_id, inspiration_item_id, created_at) select ?, inspiration_item_id, created_at from inspiration_favorite where user_id = ? on conflict do nothing", target.getId(), guestId);
        jdbcTemplate.update("delete from inspiration_favorite where user_id = ?", guestId);

        jdbcTemplate.update("delete from user_profile where user_id = ?", guestId);
        jdbcTemplate.update("delete from app_user where id = ?", guestId);
        entityManager.clear();
        outboxEventRepository.save(new OutboxEvent("Client", target.getId(), "GuestClientMergedV1",
                Map.of("guestId", guestId.toString(), "targetUserId", target.getId().toString(), "mergedBy", admin.getId().toString()), clock.instant()));
        AppUser mergedTarget = getUser(target.getId());
        return AdminUserDetailResponse.from(mergedTarget, getProfile(mergedTarget.getId()));
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

    private String normalizeOptionalPhone(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return PhoneNumberNormalizer.normalize(value);
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }
}
