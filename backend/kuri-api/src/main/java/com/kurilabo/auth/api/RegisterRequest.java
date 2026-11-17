package com.kurilabo.auth.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RegisterRequest(
        @Email @Size(max = 320) String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 40) String phone,
        @Past LocalDate birthday,
        @NotNull ClientType clientType,
        @Size(max = 200) String deviceName
) {
}

