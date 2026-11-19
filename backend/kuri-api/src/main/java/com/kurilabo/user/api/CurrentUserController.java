package com.kurilabo.user.api;

import com.kurilabo.user.application.CurrentUserService;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import jakarta.validation.Valid;
import com.kurilabo.auth.api.ChangePasswordRequest;
import com.kurilabo.auth.application.PasswordService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users/me")
public class CurrentUserController {

    private final CurrentUserService currentUserService;
    private final PasswordService passwordService;

    public CurrentUserController(CurrentUserService currentUserService, PasswordService passwordService) {
        this.currentUserService = currentUserService;
        this.passwordService = passwordService;
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    CurrentUserResponse uploadAvatar(JwtAuthenticationToken authentication, @RequestParam("file") MultipartFile file) {
        return currentUserService.uploadAvatar(UUID.fromString(authentication.getToken().getSubject()), file);
    }

    @GetMapping
    CurrentUserResponse getCurrentUser(JwtAuthenticationToken authentication) {
        return currentUserService.getCurrentUser(UUID.fromString(authentication.getToken().getSubject()));
    }

    @PutMapping
    CurrentUserResponse updateCurrentUser(
            JwtAuthenticationToken authentication,
            @Valid @RequestBody UpdateCurrentUserRequest request
    ) {
        return currentUserService.updateCurrentUser(
                UUID.fromString(authentication.getToken().getSubject()),
                request
        );
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void changePassword(JwtAuthenticationToken authentication, @Valid @RequestBody ChangePasswordRequest request) {
        passwordService.changeOwn(UUID.fromString(authentication.getToken().getSubject()), request.currentPassword(), request.newPassword());
    }
}

