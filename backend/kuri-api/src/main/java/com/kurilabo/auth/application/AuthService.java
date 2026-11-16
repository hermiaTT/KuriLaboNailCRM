package com.kurilabo.auth.application;

import com.kurilabo.auth.api.LoginRequest;
import com.kurilabo.auth.api.RegisterRequest;
import com.kurilabo.auth.config.AuthProperties;
import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.domain.RefreshToken;
import com.kurilabo.auth.domain.UserRole;
import com.kurilabo.auth.domain.UserStatus;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.auth.infrastructure.RefreshTokenRepository;
import com.kurilabo.shared.error.ApiException;
import com.kurilabo.user.domain.UserProfile;
import com.kurilabo.user.infrastructure.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {

    private final AppUserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final AuthProperties properties;

    public AuthService(
            AppUserRepository userRepository,
            UserProfileRepository profileRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            TokenService tokenService,
            AuthProperties properties
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.properties = properties;
    }

    @Transactional
    public AuthSession register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        UUID userId = UUID.randomUUID();
        AppUser user = new AppUser(
                userId,
                email,
                passwordEncoder.encode(request.password()),
                UserRole.USER
        );
        UserProfile profile = new UserProfile(
                userId,
                request.name().trim(),
                blankToNull(request.phone()),
                request.birthday()
        );
        userRepository.save(user);
        profileRepository.save(profile);
        return createSession(user, profile, request.deviceName());
    }

    @Transactional
    public AuthSession login(LoginRequest request) {
        AppUser user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(this::invalidCredentials);
        if (user.getStatus() != UserStatus.ACTIVE ||
                !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        UserProfile profile = profileRepository.findById(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "User profile is missing."));
        return createSession(user, profile, request.deviceName());
    }

    @Transactional
    public AuthSession refresh(String rawRefreshToken, String deviceName) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token is required.");
        }
        RefreshToken existing = refreshTokenRepository
                .findByTokenHash(tokenService.hashRefreshToken(rawRefreshToken))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token is invalid."));
        Instant now = Instant.now();
        if (!existing.isUsableAt(now) || existing.getUser().getStatus() != UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token is expired or revoked.");
        }
        existing.revoke(now);
        AppUser user = existing.getUser();
        UserProfile profile = profileRepository.findById(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "User profile is missing."));
        return createSession(user, profile, deviceName);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        refreshTokenRepository.findByTokenHash(tokenService.hashRefreshToken(rawRefreshToken))
                .ifPresent(token -> token.revoke(Instant.now()));
    }

    private AuthSession createSession(AppUser user, UserProfile profile, String deviceName) {
        String rawRefreshToken = tokenService.createRefreshTokenValue();
        RefreshToken refreshToken = new RefreshToken(
                UUID.randomUUID(),
                user,
                tokenService.hashRefreshToken(rawRefreshToken),
                blankToNull(deviceName),
                Instant.now().plus(properties.refreshTokenDays(), ChronoUnit.DAYS)
        );
        refreshTokenRepository.save(refreshToken);
        return new AuthSession(tokenService.createAccessToken(user), rawRefreshToken, user, profile);
    }

    private ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect.");
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

