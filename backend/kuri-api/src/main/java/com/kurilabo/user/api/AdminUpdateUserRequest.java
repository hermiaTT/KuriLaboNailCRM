package com.kurilabo.user.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record AdminUpdateUserRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 40) String phone,
        @Past LocalDate birthday,
        @Size(max = 120) String instagram,
        @Size(max = 120) String wechat,
        @Size(max = 1000) String preferredNailStyle,
        @Size(max = 1000) String allergyNotes,
        @Size(max = 5000) String adminNotes
) {
}
