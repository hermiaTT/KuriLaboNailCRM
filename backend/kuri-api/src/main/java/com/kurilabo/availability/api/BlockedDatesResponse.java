package com.kurilabo.availability.api;

import java.time.LocalDate;
import java.util.List;

public record BlockedDatesResponse(List<LocalDate> dates) {
}
