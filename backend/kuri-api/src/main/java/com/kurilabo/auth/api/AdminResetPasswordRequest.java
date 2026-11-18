package com.kurilabo.auth.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminResetPasswordRequest(@NotBlank @Size(min = 8, max = 100) String newPassword) {}
