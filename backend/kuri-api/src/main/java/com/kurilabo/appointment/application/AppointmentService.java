package com.kurilabo.appointment.application;

import com.kurilabo.appointment.api.AppointmentResponse;
import com.kurilabo.appointment.api.AdminCreateAppointmentRequest;
import com.kurilabo.appointment.api.CreateAppointmentRequest;
import com.kurilabo.appointment.domain.Appointment;
import com.kurilabo.appointment.domain.AppointmentStatus;
import com.kurilabo.appointment.domain.AppointmentStatusHistory;
import com.kurilabo.appointment.domain.CancellationRequest;
import com.kurilabo.appointment.domain.CancellationRequestStatus;
import com.kurilabo.appointment.infrastructure.AppointmentRepository;
import com.kurilabo.appointment.infrastructure.AppointmentStatusHistoryRepository;
import com.kurilabo.appointment.infrastructure.CancellationRequestRepository;
import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.availability.application.AvailabilityService;
import com.kurilabo.availability.domain.SalonSetting;
import com.kurilabo.availability.application.ScheduleLockService;
import com.kurilabo.outbox.domain.OutboxEvent;
import com.kurilabo.outbox.infrastructure.OutboxEventRepository;
import com.kurilabo.servicecatalog.domain.ServiceDefinition;
import com.kurilabo.shared.error.ApiException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.Duration;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentStatusHistoryRepository historyRepository;
    private final CancellationRequestRepository cancellationRequestRepository;
    private final AppUserRepository userRepository;
    private final AvailabilityService availabilityService;
    private final OutboxEventRepository outboxEventRepository;
    private final ScheduleLockService scheduleLockService;
    private final Clock clock;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            AppointmentStatusHistoryRepository historyRepository,
            CancellationRequestRepository cancellationRequestRepository,
            AppUserRepository userRepository,
            AvailabilityService availabilityService,
            OutboxEventRepository outboxEventRepository,
            ScheduleLockService scheduleLockService,
            Clock clock
    ) {
        this.appointmentRepository = appointmentRepository;
        this.historyRepository = historyRepository;
        this.cancellationRequestRepository = cancellationRequestRepository;
        this.userRepository = userRepository;
        this.availabilityService = availabilityService;
        this.outboxEventRepository = outboxEventRepository;
        this.scheduleLockService = scheduleLockService;
        this.clock = clock;
    }

    @Transactional
    public AppointmentResponse createUserAppointment(UUID userId, CreateAppointmentRequest request) {
        AppUser user = getUser(userId);
        ServiceDefinition service = availabilityService.getActiveService(request.serviceId());
        SalonSetting settings = availabilityService.getSettings();
        validateUserStartTime(request.startTime(), service, settings);

        ZoneId zone = ZoneId.of(settings.getTimezone());
        Instant startAt = request.date().atTime(request.startTime()).atZone(zone).toInstant();
        Instant endAt = startAt.plusSeconds(service.getDurationMinutes() * 60L);
        if (!startAt.isAfter(clock.instant())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Appointment must start in the future.");
        }
        scheduleLockService.lockDate(request.date());
        if (availabilityService.hasConflict(startAt, endAt)) {
            throw slotConflict();
        }

        Appointment appointment = new Appointment(
                UUID.randomUUID(),
                user,
                service,
                startAt,
                endAt,
                blankToNull(request.note()),
                user
        );
        try {
            appointmentRepository.saveAndFlush(appointment);
        } catch (DataIntegrityViolationException exception) {
            throw slotConflict();
        }

        Instant now = clock.instant();
        historyRepository.save(new AppointmentStatusHistory(
                appointment,
                null,
                AppointmentStatus.PENDING_CONFIRMATION,
                null,
                user,
                now
        ));
        outboxEventRepository.save(new OutboxEvent(
                appointment.getId(),
                "AppointmentRequestedV1",
                eventPayload(appointment),
                now
        ));
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse createAdminAppointment(UUID adminId, AdminCreateAppointmentRequest request) {
        AppUser admin = getUser(adminId);
        AppUser customer = userRepository.findById(request.customerId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Customer was not found."));
        SalonSetting settings = availabilityService.getSettings();
        validateAdminTimes(request.startTime(), request.endTime(), settings.getBookingIncrementMinutes());
        ZoneId zone = ZoneId.of(settings.getTimezone());
        Instant startAt = request.date().atTime(request.startTime()).atZone(zone).toInstant();
        Instant endAt = request.date().atTime(request.endTime()).atZone(zone).toInstant();
        if (!startAt.isAfter(clock.instant())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Appointment must start in the future.");
        }
        scheduleLockService.lockDate(request.date());
        if (availabilityService.hasConflict(startAt, endAt)) {
            throw slotConflict();
        }

        ServiceDefinition service = request.serviceId() == null
                ? null
                : availabilityService.getActiveService(request.serviceId());
        String serviceName = service != null
                ? service.getName()
                : blankToNull(request.customServiceName());
        if (serviceName == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A service or custom service name is required.");
        }
        int durationMinutes = Math.toIntExact(Duration.between(startAt, endAt).toMinutes());
        Appointment appointment = new Appointment(
                UUID.randomUUID(),
                customer,
                service,
                serviceName,
                durationMinutes,
                startAt,
                endAt,
                blankToNull(request.note()),
                admin
        );
        Instant now = clock.instant();
        appointment.confirm(admin, now);
        saveWithConflictProtection(appointment);
        historyRepository.save(new AppointmentStatusHistory(
                appointment,
                null,
                AppointmentStatus.CONFIRMED,
                "Created by admin",
                admin,
                now
        ));
        outboxEventRepository.save(new OutboxEvent(
                appointment.getId(),
                "AppointmentCreatedByAdminV1",
                eventPayload(appointment),
                now
        ));
        return AppointmentResponse.from(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getUserAppointments(UUID userId) {
        return appointmentRepository.findByCustomer_IdOrderByStartAtDesc(userId).stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAllByOrderByStartAtDesc().stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    @Transactional
    public AppointmentResponse requestCancellation(UUID userId, UUID appointmentId, String reason) {
        AppUser user = getUser(userId);
        Appointment appointment = getAppointment(appointmentId);
        if (!appointment.getCustomer().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This appointment does not belong to you.");
        }
        Instant now = clock.instant();
        if (!appointment.getStartAt().isAfter(now.plus(24, java.time.temporal.ChronoUnit.HOURS))) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Online cancellation requests close 24 hours before the appointment. Contact the nail artist."
            );
        }
        AppointmentStatus previous = appointment.getStatus();
        try {
            appointment.requestCancellation(now);
        } catch (IllegalStateException exception) {
            throw new ApiException(HttpStatus.CONFLICT, exception.getMessage());
        }
        cancellationRequestRepository.save(new CancellationRequest(
                appointment,
                user,
                blankToNull(reason),
                now
        ));
        recordTransition(
                appointment,
                previous,
                blankToNull(reason),
                user,
                now,
                "AppointmentCancellationRequestedV1"
        );
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse approveCancellation(UUID adminId, UUID appointmentId, String reviewNote) {
        AppUser admin = getUser(adminId);
        Appointment appointment = getAppointment(appointmentId);
        CancellationRequest request = getPendingCancellationRequest(appointmentId);
        AppointmentStatus previous = appointment.getStatus();
        Instant now = clock.instant();
        try {
            request.approve(admin, blankToNull(reviewNote), now);
            appointment.approveCancellation(now);
        } catch (IllegalStateException exception) {
            throw new ApiException(HttpStatus.CONFLICT, exception.getMessage());
        }
        recordTransition(
                appointment,
                previous,
                blankToNull(reviewNote),
                admin,
                now,
                "AppointmentCancelledV1"
        );
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse rejectCancellation(UUID adminId, UUID appointmentId, String reviewNote) {
        AppUser admin = getUser(adminId);
        Appointment appointment = getAppointment(appointmentId);
        CancellationRequest request = getPendingCancellationRequest(appointmentId);
        AppointmentStatus previous = appointment.getStatus();
        Instant now = clock.instant();
        try {
            request.reject(admin, blankToNull(reviewNote), now);
            appointment.rejectCancellation(now);
        } catch (IllegalStateException exception) {
            throw new ApiException(HttpStatus.CONFLICT, exception.getMessage());
        }
        recordTransition(
                appointment,
                previous,
                blankToNull(reviewNote),
                admin,
                now,
                "AppointmentCancellationRejectedV1"
        );
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse confirm(UUID adminId, UUID appointmentId, String reason) {
        AppUser admin = getUser(adminId);
        Appointment appointment = getAppointment(appointmentId);
        AppointmentStatus previous = appointment.getStatus();
        Instant now = clock.instant();
        try {
            appointment.confirm(admin, now);
        } catch (IllegalStateException exception) {
            throw new ApiException(HttpStatus.CONFLICT, exception.getMessage());
        }
        recordReview(appointment, previous, reason, admin, now, "AppointmentConfirmedV1");
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse reject(UUID adminId, UUID appointmentId, String reason) {
        AppUser admin = getUser(adminId);
        Appointment appointment = getAppointment(appointmentId);
        AppointmentStatus previous = appointment.getStatus();
        Instant now = clock.instant();
        try {
            appointment.reject(now);
        } catch (IllegalStateException exception) {
            throw new ApiException(HttpStatus.CONFLICT, exception.getMessage());
        }
        recordReview(appointment, previous, reason, admin, now, "AppointmentRejectedV1");
        return AppointmentResponse.from(appointment);
    }

    private void recordReview(
            Appointment appointment,
            AppointmentStatus previous,
            String reason,
            AppUser admin,
            Instant now,
            String eventType
    ) {
        recordTransition(appointment, previous, reason, admin, now, eventType);
    }

    private void recordTransition(
            Appointment appointment,
            AppointmentStatus previous,
            String reason,
            AppUser actor,
            Instant now,
            String eventType
    ) {
        historyRepository.save(new AppointmentStatusHistory(
                appointment,
                previous,
                appointment.getStatus(),
                blankToNull(reason),
                actor,
                now
        ));
        outboxEventRepository.save(new OutboxEvent(
                appointment.getId(),
                eventType,
                eventPayload(appointment),
                now
        ));
    }

    private void saveWithConflictProtection(Appointment appointment) {
        try {
            appointmentRepository.saveAndFlush(appointment);
        } catch (DataIntegrityViolationException exception) {
            throw slotConflict();
        }
    }

    private void validateAdminTimes(LocalTime start, LocalTime end, int incrementMinutes) {
        if (!end.isAfter(start)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "End time must be after start time on the same date.");
        }
        if (start.getSecond() != 0 || end.getSecond() != 0 ||
                start.getNano() != 0 || end.getNano() != 0 ||
                start.getMinute() % incrementMinutes != 0 ||
                end.getMinute() % incrementMinutes != 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Admin appointment times must use 30-minute increments.");
        }
    }

    private void validateUserStartTime(
            LocalTime startTime,
            ServiceDefinition service,
            SalonSetting settings
    ) {
        if (startTime.getSecond() != 0 || startTime.getNano() != 0 ||
                startTime.getMinute() % settings.getBookingIncrementMinutes() != 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Start time must use a 30-minute increment.");
        }
        LocalTime endTime = startTime.plusMinutes(service.getDurationMinutes());
        if (startTime.isBefore(settings.getOpeningTime()) ||
                !startTime.isBefore(settings.getClosingTime()) ||
                endTime.isAfter(settings.getClosingTime())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Appointment " + startTime + "-" + endTime +
                            " must fit within normal business hours (" +
                            settings.getOpeningTime() + "-" + settings.getClosingTime() + ")."
            );
        }
    }

    private AppUser getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User no longer exists."));
    }

    private Appointment getAppointment(UUID appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Appointment was not found."));
    }

    private CancellationRequest getPendingCancellationRequest(UUID appointmentId) {
        return cancellationRequestRepository
                .findByAppointment_IdAndStatus(appointmentId, CancellationRequestStatus.PENDING)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pending cancellation request was not found."));
    }

    private ApiException slotConflict() {
        return new ApiException(HttpStatus.CONFLICT, "That time is no longer available.");
    }

    private Map<String, Object> eventPayload(Appointment appointment) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("appointmentId", appointment.getId().toString());
        payload.put("customerId", appointment.getCustomer().getId().toString());
        payload.put(
                "serviceId",
                appointment.getServiceDefinition() == null
                        ? null
                        : appointment.getServiceDefinition().getId().toString()
        );
        payload.put("serviceName", appointment.getServiceNameSnapshot());
        payload.put("durationMinutes", appointment.getDurationMinutesSnapshot());
        payload.put("startAt", appointment.getStartAt().toString());
        payload.put("endAt", appointment.getEndAt().toString());
        payload.put("status", appointment.getStatus().name());
        return payload;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

