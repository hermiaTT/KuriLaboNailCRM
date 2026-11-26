package com.kurilabo.appointment.api;

import com.kurilabo.appointment.domain.Appointment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import java.util.List;

public record AdminAppointmentResponse(
        UUID id,
        UUID customerId,
        String customerName,
        UUID serviceId,
        String serviceName,
        int durationMinutes,
        Instant startAt,
        Instant endAt,
        String status,
        String note,
        String serviceNotes,
        BigDecimal estimatedPrice,
        BigDecimal finalPrice,
        List<AppointmentImageResponse> referenceImages
) {
    public static AdminAppointmentResponse from(Appointment appointment) {
        return new AdminAppointmentResponse(
                appointment.getId(),
                appointment.getCustomer().getId(),
                appointment.getCustomer().getAdminDisplayName(),
                appointment.getServiceDefinition() == null ? null : appointment.getServiceDefinition().getId(),
                appointment.getServiceNameSnapshot(),
                appointment.getDurationMinutesSnapshot(),
                appointment.getStartAt(),
                appointment.getEndAt(),
                appointment.getStatus().name(),
                appointment.getCustomerNote(),
                appointment.getServiceNotes(),
                appointment.getEstimatedPrice(),
                appointment.getFinalPrice(),
                appointment.getReferenceMedia().stream().map(AppointmentImageResponse::from).toList()
        );
    }
}
