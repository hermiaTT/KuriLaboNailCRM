package com.kurilabo.auth.application;

import com.kurilabo.auth.api.LoginRequest;
import com.kurilabo.auth.api.RegisterRequest;
import com.kurilabo.auth.config.AuthProperties;
import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.domain.AccountType;
import com.kurilabo.auth.domain.RefreshToken;
import com.kurilabo.auth.domain.UserRole;
import com.kurilabo.auth.domain.UserStatus;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.auth.infrastructure.RefreshTokenRepository;
import com.kurilabo.shared.error.ApiException;
import com.kurilabo.shared.phone.PhoneNumberNormalizer;
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
        String email = normalizeOptionalEmail(request.email());
        String phone = normalizePhone(request.phone());
        if (email != null && userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        if (profileRepository.existsByPhone(phone)) {
            throw new ApiException(HttpStatus.CONFLICT, "A client with this phone number already exists. Contact the salon for help merging your profile.");
        }
        String name = request.name().trim();
        if (profileRepository.existsByNameIgnoreCase(name)) {
            throw new ApiException(HttpStatus.CONFLICT, "A client with this name already exists. Contact the salon if this may be your guest profile.");
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
                name,
                phone,
                request.birthday()
        );
        userRepository.save(user);
        profileRepository.save(profile);
        return createSession(user, profile, request.deviceName());
    }

    @Transactional
    public AuthSession login(LoginRequest request) {
        String phone = normalizePhoneForLogin(request.phone());
        UserProfile profile = profileRepository.findByPhone(phone)
                .orElseThrow(this::invalidCredentials);
        AppUser user = userRepository.findById(profile.getUserId())
                .orElseThrow(this::invalidCredentials);
        if (user.getAccountType() != AccountType.REGISTERED ||
                user.getStatus() != UserStatus.ACTIVE ||
                !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
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
        return new ApiException(HttpStatus.UNAUTHORIZED, "Phone number or password is incorrect.");
    }

    private static String normalizeOptionalEmail(String email) {
        return email == null || email.isBlank() ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private static String normalizePhone(String phone) {
        try {
            return PhoneNumberNormalizer.normalize(phone);
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    private String normalizePhoneForLogin(String phone) {
        try {
            return PhoneNumberNormalizer.normalize(phone);
        } catch (IllegalArgumentException exception) {
            throw invalidCredentials();
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

