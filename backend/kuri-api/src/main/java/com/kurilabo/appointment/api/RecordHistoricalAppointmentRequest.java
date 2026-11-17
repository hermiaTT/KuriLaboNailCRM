package com.kurilabo.appointment.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record RecordHistoricalAppointmentRequest(
        @NotNull UUID customerId,
        UUID serviceId,
        @Size(max = 120) String customServiceName,
        @NotNull LocalDate date,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @DecimalMin(value = "0.00") @Digits(integer = 8, fraction = 2) BigDecimal finalPrice,
        @Size(max = 5000) String serviceNotes
) {
}
