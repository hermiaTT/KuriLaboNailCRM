package com.kurilabo.user.application;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.domain.UserRole;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.portfolio.application.LocalMediaStorage;
import com.kurilabo.portfolio.domain.MediaAsset;
import com.kurilabo.portfolio.infrastructure.MediaAssetRepository;
import com.kurilabo.shared.error.ApiException;
import com.kurilabo.shared.phone.PhoneNumberNormalizer;
import com.kurilabo.user.api.CurrentUserResponse;
import com.kurilabo.user.api.UpdateCurrentUserRequest;
import com.kurilabo.user.domain.AdminProfile;
import com.kurilabo.user.domain.Client;
import com.kurilabo.user.domain.ClientStatus;
import com.kurilabo.user.infrastructure.AdminProfileRepository;
import com.kurilabo.user.infrastructure.ClientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Clock;
import java.util.UUID;

@Service
public class CurrentUserService {
    private final AppUserRepository users;
    private final ClientRepository clients;
    private final AdminProfileRepository admins;
    private final Clock clock;
    private final LocalMediaStorage storage;
    private final MediaAssetRepository mediaAssets;

    public CurrentUserService(AppUserRepository users, ClientRepository clients, AdminProfileRepository admins,
                              Clock clock, LocalMediaStorage storage, MediaAssetRepository mediaAssets) {
        this.users = users; this.clients = clients; this.admins = admins; this.clock = clock;
        this.storage = storage; this.mediaAssets = mediaAssets;
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(UUID userId) { return response(getUser(userId)); }

    @Transactional
    public CurrentUserResponse uploadAvatar(UUID userId, MultipartFile file) {
        AppUser user = getUser(userId);
        LocalMediaStorage.StoredImage stored = storage.store(file);
        try {
            MediaAsset asset = mediaAssets.save(new MediaAsset(UUID.randomUUID(), stored.objectKey(),
                    stored.originalFilename(), stored.contentType(), stored.sizeBytes(), user, clock.instant()));
            if (user.getRole() == UserRole.ADMIN) getAdmin(userId).setAvatarMedia(asset, clock.instant());
            else getClient(user).setAvatarMedia(asset, clock.instant());
            return response(user);
        } catch (RuntimeException exception) {
            storage.delete(stored.objectKey());
            throw exception;
        }
    }

    @Transactional
    public CurrentUserResponse updateCurrentUser(UUID userId, UpdateCurrentUserRequest request) {
        AppUser user = getUser(userId);
        var now = clock.instant();
        if (user.getRole() == UserRole.ADMIN) {
            getAdmin(userId).update(request.name(), request.preferredLanguage(), now);
            return response(user);
        }
        Client client = getClient(user);
        String phone = normalizePhone(request.phone());
        if (users.existsByLoginPhoneAndIdNot(phone, userId)) {
            throw new ApiException(HttpStatus.CONFLICT, "This phone number is already used by another account.");
        }
        if (clients.existsByContactPhoneAndStatusAndIdNot(phone, ClientStatus.ACTIVE, client.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "This contact phone is already used by another client record.");
        }
        user.updateLoginPhone(phone, now);
        client.updateByClient(request.name(), phone, request.birthday(), optional(request.instagram()),
                optional(request.wechat()), optional(request.preferredNailStyle()), optional(request.allergyNotes()),
                request.preferredLanguage(), now);
        return response(user);
    }

    private CurrentUserResponse response(AppUser user) {
        return CurrentUserResponse.from(user, user.getRole() == UserRole.USER ? getClient(user) : null,
                user.getRole() == UserRole.ADMIN ? getAdmin(user.getId()) : null);
    }
    private AppUser getUser(UUID id) { return users.findById(id).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User no longer exists.")); }
    private Client getClient(AppUser user) {
        if (user.getClient() == null) throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Client link is missing.");
        return clients.findById(user.getClient().getId()).orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Client record is missing."));
    }
    private AdminProfile getAdmin(UUID id) { return admins.findById(id).orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Administrator profile is missing.")); }
    private static String optional(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private static String normalizePhone(String value) {
        try { return PhoneNumberNormalizer.normalize(value); }
        catch (IllegalArgumentException exception) { throw new ApiException(HttpStatus.BAD_REQUEST, exception.getMessage()); }
    }
}
