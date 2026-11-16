package com.kurilabo.auth.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password,
        @NotNull ClientType clientType,
        @Size(max = 200) String deviceName
) {
}

