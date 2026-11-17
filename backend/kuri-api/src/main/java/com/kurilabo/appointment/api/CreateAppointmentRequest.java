package com.kurilabo.appointment.api;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CreateAppointmentRequest(
        @NotNull UUID serviceId,
        @NotNull LocalDate date,
        @NotNull LocalTime startTime,
        @Size(max = 1000) String note
) {
}

