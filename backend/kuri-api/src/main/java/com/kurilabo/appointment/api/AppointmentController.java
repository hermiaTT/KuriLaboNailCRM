package com.kurilabo.appointment.api;

import com.kurilabo.appointment.application.AppointmentService;
import com.kurilabo.appointment.application.AppointmentReferenceService;
import jakarta.validation.Valid;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final AppointmentReferenceService referenceService;

    public AppointmentController(AppointmentService appointmentService, AppointmentReferenceService referenceService) {
        this.appointmentService = appointmentService;
        this.referenceService = referenceService;
    }

    @PostMapping(value = "/{appointmentId}/references", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    AppointmentResponse uploadReferences(JwtAuthenticationToken authentication, @PathVariable UUID appointmentId,
                                         @RequestParam("files") java.util.List<MultipartFile> files) {
        return referenceService.upload(currentUserId(authentication), appointmentId, files);
    }

    @PostMapping
    AppointmentResponse create(
            JwtAuthenticationToken authentication,
            @Valid @RequestBody CreateAppointmentRequest request
    ) {
        return appointmentService.createUserAppointment(
                UUID.fromString(authentication.getToken().getSubject()),
                request
        );
    }

    @GetMapping("/me")
    List<AppointmentResponse> getMine(JwtAuthenticationToken authentication) {
        return appointmentService.getUserAppointments(currentUserId(authentication));
    }

    @PostMapping("/{appointmentId}/cancellation-requests")
    AppointmentResponse requestCancellation(
            JwtAuthenticationToken authentication,
            @PathVariable UUID appointmentId,
            @Valid @RequestBody CancellationRequestBody request
    ) {
        return appointmentService.requestCancellation(
                currentUserId(authentication),
                appointmentId,
                request.reason()
        );
    }

    private UUID currentUserId(JwtAuthenticationToken authentication) {
        return UUID.fromString(authentication.getToken().getSubject());
    }
}

