package com.kurilabo.auth.api;

public record LogoutRequest(ClientType clientType, String refreshToken) {
}

