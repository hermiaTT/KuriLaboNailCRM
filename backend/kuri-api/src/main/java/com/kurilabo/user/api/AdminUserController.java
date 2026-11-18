package com.kurilabo.user.api;

import com.kurilabo.user.application.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import com.kurilabo.auth.api.AdminResetPasswordRequest;
import com.kurilabo.auth.application.PasswordService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final PasswordService passwordService;

    public AdminUserController(AdminUserService adminUserService, PasswordService passwordService) {
        this.adminUserService = adminUserService;
        this.passwordService = passwordService;
    }

    @GetMapping
    public List<AdminUserSummaryResponse> getAll() {
        return adminUserService.getAll();
    }

    @PostMapping("/guests")
    public AdminUserDetailResponse createGuest(
            JwtAuthenticationToken authentication,
            @Valid @RequestBody CreateGuestClientRequest request
    ) {
        return adminUserService.createGuest(
                UUID.fromString(authentication.getToken().getSubject()),
                request
        );
    }

    @GetMapping("/{userId}")
    public AdminUserDetailResponse get(@PathVariable UUID userId) {
        return adminUserService.get(userId);
    }

    @PutMapping("/{userId}")
    public AdminUserDetailResponse update(
            JwtAuthenticationToken authentication,
            @PathVariable UUID userId,
            @Valid @RequestBody AdminUpdateUserRequest request
    ) {
        return adminUserService.update(
                UUID.fromString(authentication.getToken().getSubject()),
                userId,
                request
        );
    }

    @PostMapping("/{guestId}/merge")
    public AdminUserDetailResponse merge(JwtAuthenticationToken authentication, @PathVariable UUID guestId,
                                         @Valid @RequestBody MergeGuestClientRequest request) {
        return adminUserService.mergeGuest(UUID.fromString(authentication.getToken().getSubject()), guestId, request);
    }

    @PostMapping("/{userId}/password-reset")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(JwtAuthenticationToken authentication, @PathVariable UUID userId,
                              @Valid @RequestBody AdminResetPasswordRequest request) {
        passwordService.resetByAdmin(UUID.fromString(authentication.getToken().getSubject()), userId, request.newPassword());
    }
}
