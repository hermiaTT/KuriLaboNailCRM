package com.kurilabo.availability.application;

import com.kurilabo.appointment.domain.AppointmentStatus;
import com.kurilabo.appointment.infrastructure.AppointmentRepository;
import com.kurilabo.availability.api.AvailabilityResponse;
import com.kurilabo.availability.api.AdminScheduleAvailabilityResponse;
import com.kurilabo.appointment.domain.Appointment;
import com.kurilabo.availability.domain.AvailabilityBlock;
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
import java.util.Comparator;

@Service
public class AvailabilityService {

    private static final LocalTime ADMIN_DAY_START = LocalTime.of(8, 0);
    private static final LocalTime ADMIN_DAY_END = LocalTime.of(20, 0);

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

    @Transactional(readOnly = true)
    public AdminScheduleAvailabilityResponse getAdminScheduleAvailability(
            UUID appointmentId,
            LocalDate date,
            int durationMinutes
    ) {
        SalonSetting settings = getSettings();
        ZoneId zone = ZoneId.of(settings.getTimezone());
        Instant rangeStart = date.atTime(ADMIN_DAY_START).atZone(zone).toInstant();
        Instant rangeEnd = date.atTime(ADMIN_DAY_END).atZone(zone).toInstant();

        List<Appointment> appointments = appointmentRepository.findOverlappingExcluding(
                appointmentId,
                rangeStart,
                rangeEnd,
                OCCUPYING_STATUSES
        );
        List<AvailabilityBlock> blocks = availabilityBlockRepository
                .findByStartAtLessThanAndEndAtGreaterThanOrderByStartAtAsc(rangeEnd, rangeStart);

        List<AdminScheduleAvailabilityResponse.BusyPeriod> busyPeriods = new ArrayList<>();
        List<TimeRange> occupied = new ArrayList<>();
        for (Appointment appointment : appointments) {
            LocalTime start = clippedTime(appointment.getStartAt(), rangeStart, rangeEnd, zone);
            LocalTime end = clippedTime(appointment.getEndAt(), rangeStart, rangeEnd, zone);
            occupied.add(new TimeRange(start, end));
            busyPeriods.add(new AdminScheduleAvailabilityResponse.BusyPeriod(
                    start,
                    end,
                    "APPOINTMENT",
                    appointment.getCustomer().getAdminDisplayName()
            ));
        }
        for (AvailabilityBlock block : blocks) {
            LocalTime start = clippedTime(block.getStartAt(), rangeStart, rangeEnd, zone);
            LocalTime end = clippedTime(block.getEndAt(), rangeStart, rangeEnd, zone);
            occupied.add(new TimeRange(start, end));
            busyPeriods.add(new AdminScheduleAvailabilityResponse.BusyPeriod(
                    start,
                    end,
                    "BLOCK",
                    block.getReason() == null || block.getReason().isBlank() ? "Blocked time" : block.getReason()
            ));
        }

        LocalDate today = clock.instant().atZone(zone).toLocalDate();
        LocalTime availableFrom = ADMIN_DAY_START;
        if (date.isBefore(today)) {
            availableFrom = ADMIN_DAY_END;
        } else if (date.equals(today)) {
            availableFrom = roundUpToNextFiveMinutes(clock.instant().atZone(zone).toLocalTime());
            if (availableFrom.isBefore(ADMIN_DAY_START)) availableFrom = ADMIN_DAY_START;
            if (availableFrom.isAfter(ADMIN_DAY_END)) availableFrom = ADMIN_DAY_END;
        }
        if (availableFrom.isAfter(ADMIN_DAY_START)) {
            occupied.add(new TimeRange(ADMIN_DAY_START, availableFrom));
        }

        List<TimeRange> merged = mergeRanges(occupied);
        List<AdminScheduleAvailabilityResponse.AvailableWindow> availableWindows = new ArrayList<>();
        LocalTime cursor = ADMIN_DAY_START;
        for (TimeRange range : merged) {
            if (range.start().isAfter(cursor) && minutesBetween(cursor, range.start()) >= durationMinutes) {
                availableWindows.add(new AdminScheduleAvailabilityResponse.AvailableWindow(cursor, range.start()));
            }
            if (range.end().isAfter(cursor)) cursor = range.end();
        }
        if (ADMIN_DAY_END.isAfter(cursor) && minutesBetween(cursor, ADMIN_DAY_END) >= durationMinutes) {
            availableWindows.add(new AdminScheduleAvailabilityResponse.AvailableWindow(cursor, ADMIN_DAY_END));
        }

        busyPeriods.sort(Comparator.comparing(AdminScheduleAvailabilityResponse.BusyPeriod::startTime));
        return new AdminScheduleAvailabilityResponse(
                date,
                settings.getTimezone(),
                durationMinutes,
                ADMIN_DAY_START,
                ADMIN_DAY_END,
                List.copyOf(availableWindows),
                List.copyOf(busyPeriods)
        );
    }

    private LocalTime clippedTime(Instant value, Instant rangeStart, Instant rangeEnd, ZoneId zone) {
        if (!value.isAfter(rangeStart)) return ADMIN_DAY_START;
        if (!value.isBefore(rangeEnd)) return ADMIN_DAY_END;
        return value.atZone(zone).toLocalTime();
    }

    private LocalTime roundUpToNextFiveMinutes(LocalTime value) {
        LocalTime withoutSeconds = value.withSecond(0).withNano(0);
        int minutesToAdd = 5 - (withoutSeconds.getMinute() % 5);
        return withoutSeconds.plusMinutes(minutesToAdd);
    }

    private List<TimeRange> mergeRanges(List<TimeRange> ranges) {
        List<TimeRange> sorted = ranges.stream()
                .filter(range -> range.end().isAfter(range.start()))
                .sorted(Comparator.comparing(TimeRange::start))
                .toList();
        List<TimeRange> merged = new ArrayList<>();
        for (TimeRange range : sorted) {
            if (merged.isEmpty() || range.start().isAfter(merged.getLast().end())) {
                merged.add(range);
                continue;
            }
            TimeRange previous = merged.removeLast();
            merged.add(new TimeRange(previous.start(), range.end().isAfter(previous.end()) ? range.end() : previous.end()));
        }
        return merged;
    }

    private long minutesBetween(LocalTime start, LocalTime end) {
        return java.time.Duration.between(start, end).toMinutes();
    }

    private record TimeRange(LocalTime start, LocalTime end) {
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

    public boolean hasConflictExcludingAppointment(UUID appointmentId, Instant startAt, Instant endAt) {
        return appointmentRepository.existsOverlappingExcluding(
                appointmentId,
                startAt,
                endAt,
                OCCUPYING_STATUSES
        ) || availabilityBlockRepository.existsOverlapping(startAt, endAt);
    }
}

