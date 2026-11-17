package com.kurilabo.appointment.api;

import jakarta.validation.constraints.Size;

public record CancellationRequestBody(@Size(max = 1000) String reason) {
}

