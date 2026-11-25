package com.kurilabo.auth.application;

import com.kurilabo.auth.api.LoginRequest;
import com.kurilabo.auth.api.RegisterRequest;
import com.kurilabo.auth.config.AuthProperties;
import com.kurilabo.auth.config.ClientClaimMode;
import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.domain.RefreshToken;
import com.kurilabo.auth.domain.UserRole;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.auth.infrastructure.RefreshTokenRepository;
import com.kurilabo.notification.application.NotificationService;
import com.kurilabo.outbox.domain.OutboxEvent;
import com.kurilabo.outbox.infrastructure.OutboxEventRepository;
import com.kurilabo.shared.error.ApiException;
import com.kurilabo.shared.phone.PhoneNumberNormalizer;
import com.kurilabo.user.domain.AdminProfile;
import com.kurilabo.user.domain.Client;
import com.kurilabo.user.domain.ClientStatus;
import com.kurilabo.user.infrastructure.AdminProfileRepository;
import com.kurilabo.user.infrastructure.ClientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {
    private final AppUserRepository userRepository;
    private final ClientRepository clientRepository;
    private final AdminProfileRepository adminProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final AuthProperties properties;
    private final NotificationService notificationService;

    public AuthService(AppUserRepository userRepository, ClientRepository clientRepository,
                       AdminProfileRepository adminProfileRepository, RefreshTokenRepository refreshTokenRepository,
                       OutboxEventRepository outboxEventRepository, PasswordEncoder passwordEncoder,
                       TokenService tokenService, AuthProperties properties,
                       NotificationService notificationService) {
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.adminProfileRepository = adminProfileRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.properties = properties;
        this.notificationService = notificationService;
    }

    @Transactional
    public AuthSession register(RegisterRequest request) {
        Instant now = Instant.now();
        String email = normalizeOptionalEmail(request.email());
        String phone = normalizePhone(request.phone());
        if (email != null && userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        if (userRepository.existsByLoginPhone(phone)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this phone number already exists.");
        }

        RegistrationTarget target = clientRepository.findLockedByContactPhoneAndStatus(phone, ClientStatus.ACTIVE)
                .map(existing -> claimExistingClient(existing, request, phone, now))
                .orElseGet(() -> new RegistrationTarget(createRegisteredClient(request, phone, now), false));
        Client client = target.client();
        AppUser user = userRepository.save(new AppUser(
                UUID.randomUUID(), email, passwordEncoder.encode(request.password()), phone, UserRole.USER, client
        ));
        outboxEventRepository.save(new OutboxEvent("Client", client.getId(), "ClientRegisteredV1",
                Map.of("clientId", client.getId(), "accountId", user.getId()), now));
        notifyAdminsOfRegistration(request.name().trim(), target);
        return createSession(user, request.deviceName());
    }

    @Transactional
    public AuthSession login(LoginRequest request) {
        AppUser user = userRepository.findByLoginPhone(normalizePhoneForLogin(request.phone()))
                .orElseThrow(this::invalidCredentials);
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        return createSession(user, request.deviceName());
    }

    @Transactional
    public AuthSession refresh(String rawRefreshToken, String deviceName) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token is required.");
        }
        RefreshToken existing = refreshTokenRepository.findByTokenHash(tokenService.hashRefreshToken(rawRefreshToken))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token is invalid."));
        Instant now = Instant.now();
        if (!existing.isUsableAt(now)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token is expired or revoked.");
        }
        existing.revoke(now);
        return createSession(existing.getUser(), deviceName);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) return;
        refreshTokenRepository.findByTokenHash(tokenService.hashRefreshToken(rawRefreshToken))
                .ifPresent(token -> token.revoke(Instant.now()));
    }

    private RegistrationTarget claimExistingClient(Client client, RegisterRequest request, String phone, Instant now) {
        if (userRepository.findByClient_Id(client.getId()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "This client record is already linked to an account.");
        }
        if (properties.clientClaimMode() == ClientClaimMode.OTP) {
            throw new ApiException(HttpStatus.CONFLICT, "Phone verification is required before this client can be claimed.");
        }
        if (properties.clientClaimMode() == ClientClaimMode.ADMIN_APPROVAL) {
            return new RegistrationTarget(createRegisteredClient(request, null, now), false);
        }
        client.claim(request.name(), phone, request.birthday(), now);
        outboxEventRepository.save(new OutboxEvent("Client", client.getId(), "GuestClientClaimedV1",
                Map.of("clientId", client.getId()), now));
        return new RegistrationTarget(client, true);
    }

    private void notifyAdminsOfRegistration(String registeredName, RegistrationTarget target) {
        Client client = target.client();
        if (target.autoLinked()) {
            notificationService.notifyAdminsForClient(
                    "CLIENT_REGISTERED_AUTO_LINKED",
                    "New client linked",
                    registeredName + " registered and was automatically linked to " + client.getAdminDisplayName() + ".",
                    client.getId()
            );
            return;
        }
        notificationService.notifyAdminsForClient(
                "CLIENT_REGISTERED_REVIEW",
                "New client registered",
                registeredName + " registered. Review the client profile and merge it with an existing record if needed.",
                client.getId()
        );
    }

    private Client createRegisteredClient(RegisterRequest request, String contactPhone, Instant now) {
        Client client = new Client(UUID.randomUUID(), request.name(), uniqueAdminDisplayName(request.name(), request.phone()),
                contactPhone, request.birthday(), now);
        return clientRepository.save(client);
    }

    private String uniqueAdminDisplayName(String name, String rawPhone) {
        String digits = rawPhone == null ? "" : rawPhone.replaceAll("\\D", "");
        String suffix = digits.length() > 4 ? digits.substring(digits.length() - 4) : digits;
        String base = name.trim() + (suffix.isBlank() ? "" : " · " + suffix);
        String candidate = base;
        int counter = 2;
        while (clientRepository.existsByAdminDisplayNameIgnoreCaseAndStatus(candidate, ClientStatus.ACTIVE)) {
            candidate = base + " (" + counter++ + ")";
        }
        return candidate;
    }

    private AuthSession createSession(AppUser user, String deviceName) {
        String rawRefreshToken = tokenService.createRefreshTokenValue();
        refreshTokenRepository.save(new RefreshToken(UUID.randomUUID(), user, tokenService.hashRefreshToken(rawRefreshToken),
                blankToNull(deviceName), Instant.now().plus(properties.refreshTokenDays(), ChronoUnit.DAYS)));
        Client client = user.getRole() == UserRole.USER ? user.getClient() : null;
        AdminProfile adminProfile = user.getRole() == UserRole.ADMIN
                ? adminProfileRepository.findById(user.getId()).orElseThrow(() ->
                new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Administrator profile is missing."))
                : null;
        return new AuthSession(tokenService.createAccessToken(user), rawRefreshToken, user, client, adminProfile);
    }

    private ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "Phone number or password is incorrect.");
    }

    private static String normalizeOptionalEmail(String email) {
        return email == null || email.isBlank() ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private static String normalizePhone(String phone) {
        try { return PhoneNumberNormalizer.normalize(phone); }
        catch (IllegalArgumentException exception) { throw new ApiException(HttpStatus.BAD_REQUEST, exception.getMessage()); }
    }

    private String normalizePhoneForLogin(String phone) {
        try { return PhoneNumberNormalizer.normalize(phone); }
        catch (IllegalArgumentException exception) { throw invalidCredentials(); }
    }

    private static String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    private record RegistrationTarget(Client client, boolean autoLinked) {}
}
