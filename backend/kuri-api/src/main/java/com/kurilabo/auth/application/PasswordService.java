package com.kurilabo.auth.application;

import com.kurilabo.auth.domain.*;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.auth.infrastructure.RefreshTokenRepository;
import com.kurilabo.outbox.domain.OutboxEvent;
import com.kurilabo.outbox.infrastructure.OutboxEventRepository;
import com.kurilabo.shared.error.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.Map;
import java.util.UUID;

@Service
public class PasswordService {
    private final AppUserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder encoder;
    private final OutboxEventRepository outbox;
    private final Clock clock;

    public PasswordService(AppUserRepository users, RefreshTokenRepository refreshTokens, PasswordEncoder encoder,
                           OutboxEventRepository outbox, Clock clock) {
        this.users = users; this.refreshTokens = refreshTokens; this.encoder = encoder; this.outbox = outbox; this.clock = clock;
    }

    @Transactional
    public void changeOwn(UUID userId, String currentPassword, String newPassword) {
        AppUser user = registered(userId);
        if (!encoder.matches(currentPassword, user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
        }
        update(user, newPassword, userId, "PasswordChangedV1");
    }

    @Transactional
    public void resetByAdmin(UUID adminId, UUID userId, String newPassword) {
        AppUser user = registered(userId);
        if (user.getRole() != UserRole.USER) throw new ApiException(HttpStatus.CONFLICT, "Use account recovery for administrator passwords.");
        update(user, newPassword, adminId, "PasswordResetByAdminV1");
    }

    private void update(AppUser user, String password, UUID actorId, String eventType) {
        var now = clock.instant();
        user.updatePassword(encoder.encode(password), now);
        refreshTokens.findByUser_IdAndRevokedAtIsNull(user.getId()).forEach(token -> token.revoke(now));
        outbox.save(new OutboxEvent("User", user.getId(), eventType,
                Map.of("userId", user.getId().toString(), "actorId", actorId.toString()), now));
    }

    private AppUser registered(UUID id) {
        AppUser user = users.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User was not found."));
        if (user.getAccountType() != AccountType.REGISTERED) throw new ApiException(HttpStatus.CONFLICT, "Guest clients do not have passwords.");
        return user;
    }
}
