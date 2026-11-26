package com.kurilabo.appointment.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateVisitDetailsRequest(
        @Size(max = 5000) String serviceNotes,
        @DecimalMin(value = "0.00") @Digits(integer = 8, fraction = 2) BigDecimal estimatedPrice,
        @DecimalMin(value = "0.00") @Digits(integer = 8, fraction = 2) BigDecimal finalPrice
) {
}
