package com.kurilabo.appointment.api;

import com.kurilabo.appointment.application.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;
import java.util.List;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import com.kurilabo.availability.api.AdminScheduleAvailabilityResponse;

@RestController
@RequestMapping("/api/v1/admin/appointments")
public class AdminAppointmentController {

    private final AppointmentService appointmentService;

    public AdminAppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    List<AdminAppointmentResponse> getAll(@RequestParam(required = false) UUID customerId) {
        return appointmentService.getAllAdminAppointments(customerId);
    }

    @PostMapping
    AdminAppointmentResponse create(
            JwtAuthenticationToken authentication,
            @Valid @RequestBody AdminCreateAppointmentRequest request
    ) {
        return appointmentService.createAdminAppointment(currentUserId(authentication), request);
    }

    @PostMapping("/history")
    AdminAppointmentResponse recordHistory(
            JwtAuthenticationToken authentication,
            @Valid @RequestBody RecordHistoricalAppointmentRequest request
    ) {
        return appointmentService.recordHistoricalAppointment(
                currentUserId(authentication),
                request
        );
    }

    @PutMapping("/{appointmentId}/visit-details")
    AdminAppointmentResponse updateVisitDetails(
            JwtAuthenticationToken authentication,
            @PathVariable UUID appointmentId,
            @Valid @RequestBody UpdateVisitDetailsRequest request
    ) {
        return appointmentService.updateVisitDetails(
                currentUserId(authentication),
                appointmentId,
                request
        );
    }

    @PutMapping("/{appointmentId}/schedule")
    AdminAppointmentResponse reschedule(
            JwtAuthenticationToken authentication,
            @PathVariable UUID appointmentId,
            @Valid @RequestBody RescheduleAppointmentRequest request
    ) {
        return appointmentService.reschedule(
                currentUserId(authentication),
                appointmentId,
                request
        );
    }

    @GetMapping("/{appointmentId}/availability")
    AdminScheduleAvailabilityResponse getRescheduleAvailability(
            @PathVariable UUID appointmentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return appointmentService.getRescheduleAvailability(appointmentId, date);
    }

    @PostMapping("/{appointmentId}/confirm")
    AppointmentResponse confirm(
            JwtAuthenticationToken authentication,
            @PathVariable UUID appointmentId,
            @Valid @RequestBody ReviewAppointmentRequest request
    ) {
        return appointmentService.confirm(currentUserId(authentication), appointmentId, request.reason());
    }

    @PostMapping("/{appointmentId}/reject")
    AppointmentResponse reject(
            JwtAuthenticationToken authentication,
            @PathVariable UUID appointmentId,
            @Valid @RequestBody ReviewAppointmentRequest request
    ) {
        return appointmentService.reject(currentUserId(authentication), appointmentId, request.reason());
    }

    @PostMapping("/{appointmentId}/complete")
    AppointmentResponse complete(
            JwtAuthenticationToken authentication,
            @PathVariable UUID appointmentId,
            @Valid @RequestBody ReviewAppointmentRequest request
    ) {
        return appointmentService.complete(currentUserId(authentication), appointmentId, request.reason());
    }

    @PostMapping("/{appointmentId}/no-show")
    AppointmentResponse markNoShow(
            JwtAuthenticationToken authentication,
            @PathVariable UUID appointmentId,
            @Valid @RequestBody ReviewAppointmentRequest request
    ) {
        return appointmentService.markNoShow(currentUserId(authentication), appointmentId, request.reason());
    }

    @PostMapping("/{appointmentId}/cancellation-requests/approve")
    AppointmentResponse approveCancellation(
            JwtAuthenticationToken authentication,
            @PathVariable UUID appointmentId,
            @Valid @RequestBody ReviewAppointmentRequest request
    ) {
        return appointmentService.approveCancellation(
                currentUserId(authentication),
                appointmentId,
                request.reason()
        );
    }

    @PostMapping("/{appointmentId}/cancellation-requests/reject")
    AppointmentResponse rejectCancellation(
            JwtAuthenticationToken authentication,
            @PathVariable UUID appointmentId,
            @Valid @RequestBody ReviewAppointmentRequest request
    ) {
        return appointmentService.rejectCancellation(
                currentUserId(authentication),
                appointmentId,
                request.reason()
        );
    }

    private UUID currentUserId(JwtAuthenticationToken authentication) {
        return UUID.fromString(authentication.getToken().getSubject());
    }
}

