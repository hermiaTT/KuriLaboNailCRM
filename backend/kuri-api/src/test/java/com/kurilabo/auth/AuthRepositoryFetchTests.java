package com.kurilabo.auth;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.domain.RefreshToken;
import com.kurilabo.auth.domain.UserRole;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.auth.infrastructure.RefreshTokenRepository;
import com.kurilabo.user.domain.Client;
import com.kurilabo.user.infrastructure.ClientRepository;
import jakarta.persistence.EntityManager;
import org.hibernate.Hibernate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class AuthRepositoryFetchTests {

    @Autowired AppUserRepository users;
    @Autowired ClientRepository clients;
    @Autowired RefreshTokenRepository refreshTokens;
    @Autowired EntityManager entityManager;

    @Test
    void loginAndRefreshQueriesLoadClientNeededByAuthResponse() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        Client client = clients.save(new Client(
                UUID.randomUUID(), "Login Client", "Login Client " + suffix,
                "+1604555" + suffix.substring(0, 4), LocalDate.of(1995, 1, 1), Instant.now()
        ));
        AppUser user = users.save(new AppUser(
                UUID.randomUUID(), null, "encoded-password", "+1778555" + suffix.substring(0, 4),
                UserRole.USER, client
        ));
        refreshTokens.save(new RefreshToken(
                UUID.randomUUID(), user, "token-hash-" + suffix, "test",
                Instant.now().plus(1, ChronoUnit.DAYS)
        ));
        entityManager.flush();
        entityManager.clear();

        AppUser loginUser = users.findByLoginPhone(user.getLoginPhone()).orElseThrow();
        assertTrue(Hibernate.isInitialized(loginUser.getClient()));
        assertEquals("Login Client", loginUser.getClient().getClientName());

        entityManager.clear();
        RefreshToken refreshToken = refreshTokens.findByTokenHash("token-hash-" + suffix).orElseThrow();
        assertTrue(Hibernate.isInitialized(refreshToken.getUser().getClient()));
        assertEquals("Login Client", refreshToken.getUser().getClient().getClientName());
    }
}
