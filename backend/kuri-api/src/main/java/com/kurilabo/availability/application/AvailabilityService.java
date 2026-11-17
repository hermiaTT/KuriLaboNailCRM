package com.kurilabo.availability.application;

import com.kurilabo.appointment.domain.AppointmentStatus;
import com.kurilabo.appointment.infrastructure.AppointmentRepository;
import com.kurilabo.availability.api.AvailabilityResponse;
import com.kurilabo.availability.domain.SalonSetting;
import com.kurilabo.availability.infrastructure.AvailabilityBlockRepository;
import com.kurilabo.availability.infrastructure.SalonSettingRepository;
import com.kurilabo.servicecatalog.domain.ServiceDefinition;
import com.kurilabo.servicecatalog.infrastructure.ServiceDefinitionRepository;
import com.kurilabo.shared.error.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;

@Service
public class AvailabilityService {

    public static final EnumSet<AppointmentStatus> OCCUPYING_STATUSES = EnumSet.of(
            AppointmentStatus.PENDING_CONFIRMATION,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CANCELLATION_REQUESTED
    );

    private final SalonSettingRepository salonSettingRepository;
    private final ServiceDefinitionRepository serviceDefinitionRepository;
    private final AppointmentRepository appointmentRepository;
    private final AvailabilityBlockRepository availabilityBlockRepository;
    private final Clock clock;

    public AvailabilityService(
            SalonSettingRepository salonSettingRepository,
            ServiceDefinitionRepository serviceDefinitionRepository,
            AppointmentRepository appointmentRepository,
            AvailabilityBlockRepository availabilityBlockRepository,
            Clock clock
    ) {
        this.salonSettingRepository = salonSettingRepository;
        this.serviceDefinitionRepository = serviceDefinitionRepository;
        this.appointmentRepository = appointmentRepository;
        this.availabilityBlockRepository = availabilityBlockRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public AvailabilityResponse getAvailability(LocalDate date, UUID serviceId) {
        SalonSetting settings = getSettings();
        ServiceDefinition service = getActiveService(serviceId);
        ZoneId zone = ZoneId.of(settings.getTimezone());
        Instant now = clock.instant();
        List<AvailabilityResponse.TimeSlot> slots = new ArrayList<>();

        LocalTime start = settings.getOpeningTime();
        while (!start.plusMinutes(service.getDurationMinutes()).isAfter(settings.getClosingTime())) {
            LocalTime end = start.plusMinutes(service.getDurationMinutes());
            Instant startAt = date.atTime(start).atZone(zone).toInstant();
            Instant endAt = date.atTime(end).atZone(zone).toInstant();
            boolean available = startAt.isAfter(now)
                    && !appointmentRepository.existsOverlapping(startAt, endAt, OCCUPYING_STATUSES)
                    && !availabilityBlockRepository.existsOverlapping(startAt, endAt);
            slots.add(new AvailabilityResponse.TimeSlot(start, end, startAt, endAt, available));
            start = start.plusMinutes(settings.getBookingIncrementMinutes());
        }

        return new AvailabilityResponse(
                date,
                settings.getTimezone(),
                service.getId(),
                service.getDurationMinutes(),
                List.copyOf(slots)
        );
    }

    public SalonSetting getSettings() {
        return salonSettingRepository.findById((short) 1)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Salon settings are missing."));
    }

    public ServiceDefinition getActiveService(UUID serviceId) {
        ServiceDefinition service = getService(serviceId);
        if (!service.isActive()) {
            throw new ApiException(HttpStatus.CONFLICT, "Service is not currently available.");
        }
        return service;
    }

    public ServiceDefinition getService(UUID serviceId) {
        return serviceDefinitionRepository.findById(serviceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Service was not found."));
    }

    public boolean hasConflict(Instant startAt, Instant endAt) {
        return appointmentRepository.existsOverlapping(startAt, endAt, OCCUPYING_STATUSES)
                || availabilityBlockRepository.existsOverlapping(startAt, endAt);
    }
}

