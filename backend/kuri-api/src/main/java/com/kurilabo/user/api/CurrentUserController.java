package com.kurilabo.user.api;

import com.kurilabo.user.application.CurrentUserService;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import jakarta.validation.Valid;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users/me")
public class CurrentUserController {

    private final CurrentUserService currentUserService;

    public CurrentUserController(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
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
}

