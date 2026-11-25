package com.kurilabo.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "kuri.auth")
public record AuthProperties(
        String issuer,
        long accessTokenMinutes,
        long refreshTokenDays,
        String tokenSecret,
        boolean secureCookie,
        ClientClaimMode clientClaimMode
) {
    public AuthProperties {
        if (secureCookie && clientClaimMode == ClientClaimMode.TEST_AUTO) {
            throw new IllegalStateException("TEST_AUTO client claiming cannot run with secure production cookies.");
        }
    }
}

