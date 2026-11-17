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

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
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
}
