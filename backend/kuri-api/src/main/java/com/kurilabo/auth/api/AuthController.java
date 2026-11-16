package com.kurilabo.auth.api;

import com.kurilabo.auth.application.AuthService;
import com.kurilabo.auth.application.AuthSession;
import com.kurilabo.auth.config.AuthProperties;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    static final String REFRESH_COOKIE = "kuri_refresh";

    private final AuthService authService;
    private final AuthProperties properties;

    public AuthController(AuthService authService, AuthProperties properties) {
        this.authService = authService;
        this.properties = properties;
    }

    @PostMapping("/register")
    ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response
    ) {
        return sessionResponse(authService.register(request), request.clientType(), response);
    }

    @PostMapping("/login")
    ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        return sessionResponse(authService.login(request), request.clientType(), response);
    }

    @PostMapping("/refresh")
    ResponseEntity<AuthResponse> refresh(
            @Valid @RequestBody RefreshRequest request,
            @CookieValue(name = REFRESH_COOKIE, required = false) String cookieToken,
            HttpServletResponse response
    ) {
        String rawToken = request.clientType() == ClientType.WEB ? cookieToken : request.refreshToken();
        return sessionResponse(
                authService.refresh(rawToken, request.deviceName()),
                request.clientType(),
                response
        );
    }

    @PostMapping("/logout")
    ResponseEntity<Void> logout(
            @RequestBody LogoutRequest request,
            @CookieValue(name = REFRESH_COOKIE, required = false) String cookieToken,
            HttpServletResponse response
    ) {
        ClientType clientType = request.clientType() == null ? ClientType.WEB : request.clientType();
        String rawToken = clientType == ClientType.WEB ? cookieToken : request.refreshToken();
        authService.logout(rawToken);
        if (clientType == ClientType.WEB) {
            clearRefreshCookie(response);
        }
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<AuthResponse> sessionResponse(
            AuthSession session,
            ClientType clientType,
            HttpServletResponse response
    ) {
        boolean mobile = clientType == ClientType.MOBILE;
        if (!mobile) {
            setRefreshCookie(response, session.refreshToken());
        }
        return ResponseEntity.ok(AuthResponse.from(session, mobile));
    }

    private void setRefreshCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, token)
                .httpOnly(true)
                .secure(properties.secureCookie())
                .sameSite("Strict")
                .path("/api/v1/auth")
                .maxAge(Duration.ofDays(properties.refreshTokenDays()))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true)
                .secure(properties.secureCookie())
                .sameSite("Strict")
                .path("/api/v1/auth")
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}

