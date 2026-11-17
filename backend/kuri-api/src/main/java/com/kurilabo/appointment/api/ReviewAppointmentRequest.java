package com.kurilabo.appointment.api;

import jakarta.validation.constraints.Size;

public record ReviewAppointmentRequest(@Size(max = 1000) String reason) {
}

