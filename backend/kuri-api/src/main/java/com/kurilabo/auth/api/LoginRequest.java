package com.kurilabo.auth.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Size(max = 40) String phone,
        @NotBlank String password,
        @NotNull ClientType clientType,
        @Size(max = 200) String deviceName
) {
}

