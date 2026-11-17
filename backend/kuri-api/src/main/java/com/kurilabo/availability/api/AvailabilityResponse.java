package com.kurilabo.availability.api;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record AvailabilityResponse(
        LocalDate date,
        String timezone,
        UUID serviceId,
        int durationMinutes,
        List<TimeSlot> slots
) {
    public record TimeSlot(
            LocalTime startTime,
            LocalTime endTime,
            Instant startAt,
            Instant endAt,
            boolean available
    ) {
    }
}

