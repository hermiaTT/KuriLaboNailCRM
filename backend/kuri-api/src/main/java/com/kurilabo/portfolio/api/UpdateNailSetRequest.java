package com.kurilabo.portfolio.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateNailSetRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 5000) String description,
        UUID clientId,
        UUID appointmentId
) {
}
