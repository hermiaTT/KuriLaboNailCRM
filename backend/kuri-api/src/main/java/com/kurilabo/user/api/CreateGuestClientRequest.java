package com.kurilabo.user.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateGuestClientRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 40) String phone
) {
}
