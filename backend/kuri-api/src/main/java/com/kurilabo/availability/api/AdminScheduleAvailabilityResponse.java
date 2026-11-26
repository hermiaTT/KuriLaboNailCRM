package com.kurilabo.availability.api;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record AdminScheduleAvailabilityResponse(
        LocalDate date,
        String timezone,
        int durationMinutes,
        LocalTime dayStart,
        LocalTime dayEnd,
        List<AvailableWindow> availableWindows,
        List<BusyPeriod> busyPeriods
) {
    public record AvailableWindow(LocalTime startTime, LocalTime endTime) {
    }

    public record BusyPeriod(LocalTime startTime, LocalTime endTime, String type, String label) {
    }
}
