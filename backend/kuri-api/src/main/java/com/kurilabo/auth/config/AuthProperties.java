package com.kurilabo.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "kuri.auth")
public record AuthProperties(
        String issuer,
        long accessTokenMinutes,
        long refreshTokenDays,
        String tokenSecret,
        boolean secureCookie
) {
}

