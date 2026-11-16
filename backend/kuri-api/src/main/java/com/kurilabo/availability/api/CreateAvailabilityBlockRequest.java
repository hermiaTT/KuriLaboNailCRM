package com.kurilabo.availability.api;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record CreateAvailabilityBlockRequest(
        @NotNull LocalDate date,
        boolean fullDay,
        LocalTime startTime,
        LocalTime endTime,
        @Size(max = 1000) String reason
) {
}

