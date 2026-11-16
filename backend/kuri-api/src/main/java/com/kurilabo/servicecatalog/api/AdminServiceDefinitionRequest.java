package com.kurilabo.servicecatalog.api;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminServiceDefinitionRequest(
        @NotBlank @Size(max = 60) String code,
        @NotBlank @Size(max = 120) String name,
        @Size(max = 2000) String description,
        @Min(30) int durationMinutes,
        @Min(0) int displayOrder,
        @NotNull Boolean active
) {
}
