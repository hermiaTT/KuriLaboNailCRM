package com.kurilabo.user.application;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.shared.error.ApiException;
import com.kurilabo.shared.phone.PhoneNumberNormalizer;
import com.kurilabo.user.api.CurrentUserResponse;
import com.kurilabo.user.api.UpdateCurrentUserRequest;
import com.kurilabo.user.domain.UserProfile;
import com.kurilabo.user.infrastructure.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.time.Clock;
import com.kurilabo.portfolio.application.LocalMediaStorage;
import com.kurilabo.portfolio.domain.MediaAsset;
import com.kurilabo.portfolio.infrastructure.MediaAssetRepository;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CurrentUserService {

    private final AppUserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final Clock clock;
    private final LocalMediaStorage storage;
    private final MediaAssetRepository mediaAssetRepository;

    public CurrentUserService(
            AppUserRepository userRepository,
            UserProfileRepository profileRepository,
            Clock clock,
            LocalMediaStorage storage,
            MediaAssetRepository mediaAssetRepository
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.clock = clock;
        this.storage = storage;
        this.mediaAssetRepository = mediaAssetRepository;
    }

    @Transactional
    public CurrentUserResponse uploadAvatar(UUID userId, MultipartFile file) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User no longer exists."));
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "User profile is missing."));
        LocalMediaStorage.StoredImage stored = storage.store(file);
        try {
            MediaAsset asset = mediaAssetRepository.save(new MediaAsset(UUID.randomUUID(), stored.objectKey(),
                    stored.originalFilename(), stored.contentType(), stored.sizeBytes(), user, clock.instant()));
            profile.setAvatarMedia(asset, clock.instant());
            return CurrentUserResponse.from(user, profile);
        } catch (RuntimeException exception) {
            storage.delete(stored.objectKey());
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(UUID userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User no longer exists."));
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "User profile is missing."));
        return CurrentUserResponse.from(user, profile);
    }

    @Transactional
    public CurrentUserResponse updateCurrentUser(UUID userId, UpdateCurrentUserRequest request) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User no longer exists."));
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "User profile is missing."));
        String name = request.name().trim();
        if (profileRepository.existsByNameIgnoreCaseAndUserIdNot(name, userId)) {
            throw new ApiException(HttpStatus.CONFLICT, "A client with this name already exists.");
        }
        String phone = normalizePhone(request.phone());
        if (profileRepository.existsByPhoneAndUserIdNot(phone, userId)) {
            throw new ApiException(HttpStatus.CONFLICT, "This phone number is already used by another client.");
        }
        profile.updateByUser(
                name,
                phone,
                request.birthday(),
                normalizeOptional(request.instagram()),
                normalizeOptional(request.wechat()),
                normalizeOptional(request.preferredNailStyle()),
                normalizeOptional(request.allergyNotes()),
                clock.instant()
        );
        return CurrentUserResponse.from(user, profile);
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

