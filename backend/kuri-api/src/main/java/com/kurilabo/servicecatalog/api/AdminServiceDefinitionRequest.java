package com.kurilabo.servicecatalog.api;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminServiceDefinitionRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 2000) String description,
        @Min(30) @Max(300) int durationMinutes,
        @NotNull @DecimalMin("0.00") java.math.BigDecimal price,
        @Min(0) int displayOrder,
        @NotNull Boolean active
) {
}
