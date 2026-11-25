package com.kurilabo.user;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.domain.UserRole;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.user.api.CurrentUserResponse;
import com.kurilabo.user.api.UpdateCurrentUserRequest;
import com.kurilabo.user.application.CurrentUserService;
import com.kurilabo.user.domain.Client;
import com.kurilabo.user.infrastructure.AdminProfileRepository;
import com.kurilabo.user.infrastructure.ClientRepository;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class LanguagePreferenceTests {
    @Test
    void savedLanguageSurvivesProfileReadsAndOlderClientUpdates() {
        UUID id = UUID.randomUUID();
        Client client = new Client(UUID.randomUUID(), "Client", "Client · 1234", "+16045551234", null, Instant.now());
        AppUser user = new AppUser(id, null, "hash", "+16045551234", UserRole.USER, client);
        assertEquals("en", client.getPreferredLanguage());
        AppUserRepository users = repositoryStub(AppUserRepository.class, user);
        ClientRepository clients = repositoryStub(ClientRepository.class, client);
        AdminProfileRepository admins = repositoryStub(AdminProfileRepository.class, null);
        var service = new CurrentUserService(users, clients, admins, Clock.systemUTC(), null, null);
        assertEquals("zh-CN", service.updateCurrentUser(id, request("zh-CN")).preferredLanguage());
        assertEquals("zh-CN", service.getCurrentUser(id).preferredLanguage());
        assertEquals("zh-CN", service.updateCurrentUser(id, request(null)).preferredLanguage());
        assertEquals("en", service.updateCurrentUser(id, request("en")).preferredLanguage());
        assertEquals("en", CurrentUserResponse.from(user, client, null).preferredLanguage());
    }

    @Test
    void onlySupportedLanguagesAreAcceptedAndOmissionIsBackwardCompatible() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            for (String language : new String[] { "en", "zh-CN", null }) {
                assertTrue(validator.validate(request(language)).isEmpty());
            }
            for (String language : new String[] { "fr", "", "zh", "EN" }) {
                assertTrue(validator.validate(request(language)).stream()
                        .anyMatch(error -> error.getPropertyPath().toString().equals("preferredLanguage")));
            }
        }
    }

    @SuppressWarnings("unchecked")
    private <T> T repositoryStub(Class<T> type, Object entity) {
        return (T) java.lang.reflect.Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[] {type},
                (proxy, method, args) -> method.getName().equals("findById") ? Optional.ofNullable(entity) : false);
    }

    private UpdateCurrentUserRequest request(String language) {
        return new UpdateCurrentUserRequest("Client", "+16045551234", null, null, null, null, null, language);
    }
}
