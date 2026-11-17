package com.kurilabo.appointment.api;

import com.kurilabo.appointment.domain.Appointment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AdminAppointmentResponse(
        UUID id,
        UUID customerId,
        UUID serviceId,
        String serviceName,
        int durationMinutes,
        Instant startAt,
        Instant endAt,
        String status,
        String note,
        String serviceNotes,
        BigDecimal finalPrice
) {
    public static AdminAppointmentResponse from(Appointment appointment) {
        return new AdminAppointmentResponse(
                appointment.getId(),
                appointment.getCustomer().getId(),
                appointment.getServiceDefinition() == null ? null : appointment.getServiceDefinition().getId(),
                appointment.getServiceNameSnapshot(),
                appointment.getDurationMinutesSnapshot(),
                appointment.getStartAt(),
                appointment.getEndAt(),
                appointment.getStatus().name(),
                appointment.getCustomerNote(),
                appointment.getServiceNotes(),
                appointment.getFinalPrice()
        );
    }
}
