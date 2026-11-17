package com.kurilabo.auth.api;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RefreshRequest(
        @NotNull ClientType clientType,
        String refreshToken,
        @Size(max = 200) String deviceName
) {
}

