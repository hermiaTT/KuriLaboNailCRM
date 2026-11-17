package com.kurilabo.appointment.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record AdminCreateAppointmentRequest(
        @NotNull UUID customerId,
        UUID serviceId,
        @Size(max = 120) String customServiceName,
        @NotNull LocalDate date,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @Size(max = 1000) String note
) {
}
