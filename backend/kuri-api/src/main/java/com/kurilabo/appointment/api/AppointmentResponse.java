package com.kurilabo.appointment.api;

import com.kurilabo.appointment.domain.Appointment;

import java.time.Instant;
import java.util.UUID;
import java.util.List;

public record AppointmentResponse(
        UUID id,
        UUID customerId,
        UUID serviceId,
        String serviceName,
        int durationMinutes,
        Instant startAt,
        Instant endAt,
        String status,
        String note,
        List<AppointmentImageResponse> referenceImages
) {
    public static AppointmentResponse from(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getCustomer().getId(),
                appointment.getServiceDefinition() == null ? null : appointment.getServiceDefinition().getId(),
                appointment.getServiceNameSnapshot(),
                appointment.getDurationMinutesSnapshot(),
                appointment.getStartAt(),
                appointment.getEndAt(),
                appointment.getStatus().name(),
                appointment.getCustomerNote(),
                appointment.getReferenceMedia().stream().map(AppointmentImageResponse::from).toList()
        );
    }
}

