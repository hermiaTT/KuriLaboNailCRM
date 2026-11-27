package com.kurilabo.appointment.application;

import com.kurilabo.appointment.api.AppointmentResponse;
import com.kurilabo.appointment.api.AdminAppointmentResponse;
import com.kurilabo.appointment.api.AdminCreateAppointmentRequest;
import com.kurilabo.appointment.api.CreateAppointmentRequest;
import com.kurilabo.appointment.api.UpdateVisitDetailsRequest;
import com.kurilabo.appointment.api.RecordHistoricalAppointmentRequest;
import com.kurilabo.appointment.api.RescheduleAppointmentRequest;
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
import com.kurilabo.user.domain.Client;
import com.kurilabo.user.infrastructure.ClientRepository;
import com.kurilabo.availability.application.AvailabilityService;
import com.kurilabo.availability.domain.SalonSetting;
import com.kurilabo.availability.api.AdminScheduleAvailabilityResponse;
import com.kurilabo.availability.application.ScheduleLockService;
import com.kurilabo.outbox.domain.OutboxEvent;
import com.kurilabo.outbox.infrastructure.OutboxEventRepository;
import com.kurilabo.notification.application.NotificationService;
import com.kurilabo.servicecatalog.domain.ServiceDefinition;
import com.kurilabo.shared.error.ApiException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.Duration;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.Objects;

@Service
public class AppointmentService {

    private static final int ADMIN_TIME_INCREMENT_MINUTES = 5;

    private final AppointmentRepository appointmentRepository;
    private final AppointmentStatusHistoryRepository historyRepository;
    private final CancellationRequestRepository cancellationRequestRepository;
    private final AppUserRepository userRepository;
    private final ClientRepository clientRepository;
    private final AvailabilityService availabilityService;
    private final OutboxEventRepository outboxEventRepository;
    private final ScheduleLockService scheduleLockService;
    private final Clock clock;
    private final NotificationService notificationService;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            AppointmentStatusHistoryRepository historyRepository,
            CancellationRequestRepository cancellationRequestRepository,
            AppUserRepository userRepository,
            ClientRepository clientRepository,
            AvailabilityService availabilityService,
            OutboxEventRepository outboxEventRepository,
            ScheduleLockService scheduleLockService,
            Clock clock,
            NotificationService notificationService
    ) {
        this.appointmentRepository = appointmentRepository;
        this.historyRepository = historyRepository;
        this.cancellationRequestRepository = cancellationRequestRepository;
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.availabilityService = availabilityService;
        this.outboxEventRepository = outboxEventRepository;
        this.scheduleLockService = scheduleLockService;
        this.clock = clock;
        this.notificationService = notificationService;
    }

    @Transactional
    public AppointmentResponse createUserAppointment(UUID userId, CreateAppointmentRequest request) {
        AppUser user = getUser(userId);
        Client customer = getClientForUser(user);
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
                customer,
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
        notificationService.notifyAdmins("BOOKING_REQUEST", "New booking request",
                "A client requested " + appointment.getServiceNameSnapshot() + ".", appointment.getId());
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AdminAppointmentResponse createAdminAppointment(UUID adminId, AdminCreateAppointmentRequest request) {
        AppUser admin = getUser(adminId);
        Client customer = clientRepository.findById(request.customerId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Customer was not found."));
        SalonSetting settings = availabilityService.getSettings();
        validateAdminTimes(request.startTime(), request.endTime());
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
        notificationService.notifyClient(customer, "APPOINTMENT_CREATED", "Appointment added",
                "Kuri added a " + appointment.getServiceNameSnapshot() + " appointment to your schedule.", appointment.getId());
        return AdminAppointmentResponse.from(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getUserAppointments(UUID userId) {
        AppUser user = getUser(userId);
        return appointmentRepository.findByCustomer_IdOrderByStartAtDesc(getClientForUser(user).getId()).stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAllByOrderByStartAtDesc().stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminAppointmentResponse> getAllAdminAppointments(UUID customerId) {
        List<Appointment> appointments = customerId == null
                ? appointmentRepository.findAllByOrderByStartAtDesc()
                : appointmentRepository.findByCustomer_IdOrderByStartAtDesc(customerId);
        return appointments.stream()
                .map(AdminAppointmentResponse::from)
                .toList();
    }

    @Transactional
    public AdminAppointmentResponse recordHistoricalAppointment(
            UUID adminId,
            RecordHistoricalAppointmentRequest request
    ) {
        AppUser admin = getUser(adminId);
        Client customer = clientRepository.findById(request.customerId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Customer was not found."));
        SalonSetting settings = availabilityService.getSettings();
        validateAdminTimes(request.startTime(), request.endTime());
        ZoneId zone = ZoneId.of(settings.getTimezone());
        Instant startAt = request.date().atTime(request.startTime()).atZone(zone).toInstant();
        Instant endAt = request.date().atTime(request.endTime()).atZone(zone).toInstant();
        Instant now = clock.instant();
        if (endAt.isAfter(now)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A past visit must have already ended.");
        }

        ServiceDefinition service = request.serviceId() == null
                ? null
                : availabilityService.getService(request.serviceId());
        String serviceName = service != null
                ? service.getName()
                : blankToNull(request.customServiceName());
        if (serviceName == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A service or legacy service name is required.");
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
                null,
                admin
        );
        appointment.recordCompleted(
                admin,
                blankToNull(request.serviceNotes()),
                request.finalPrice(),
                now
        );
        appointmentRepository.save(appointment);
        historyRepository.save(new AppointmentStatusHistory(
                appointment,
                null,
                AppointmentStatus.COMPLETED,
                "Historical visit recorded by admin",
                admin,
                now
        ));
        Map<String, Object> payload = eventPayload(appointment);
        payload.put("recordedBy", admin.getId().toString());
        payload.put("finalPrice", request.finalPrice());
        outboxEventRepository.save(new OutboxEvent(
                appointment.getId(),
                "HistoricalAppointmentRecordedV1",
                payload,
                now
        ));
        return AdminAppointmentResponse.from(appointment);
    }

    @Transactional
    public AdminAppointmentResponse updateVisitDetails(
            UUID adminId,
            UUID appointmentId,
            UpdateVisitDetailsRequest request
    ) {
        AppUser admin = getUser(adminId);
        Appointment appointment = getAppointment(appointmentId);
        String serviceNotes = blankToNull(request.serviceNotes());
        if (request.finalPrice() != null && appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new ApiException(HttpStatus.CONFLICT, "Final price can only be recorded for a completed appointment.");
        }
        boolean priceChanged = !Objects.equals(appointment.getEstimatedPrice(), request.estimatedPrice())
                || !Objects.equals(appointment.getFinalPrice(), request.finalPrice());
        Instant now = clock.instant();
        appointment.updateVisitDetails(serviceNotes, request.estimatedPrice(), request.finalPrice(), now);

        Map<String, Object> payload = eventPayload(appointment);
        payload.put("updatedBy", admin.getId().toString());
        payload.put("hasServiceNotes", serviceNotes != null);
        payload.put("estimatedPrice", request.estimatedPrice());
        payload.put("finalPrice", request.finalPrice());
        outboxEventRepository.save(new OutboxEvent(
                appointment.getId(),
                priceChanged ? "AppointmentPriceUpdatedV1" : "AppointmentVisitDetailsUpdatedV1",
                payload,
                now
        ));
        return AdminAppointmentResponse.from(appointment);
    }

    @Transactional
    public AdminAppointmentResponse reschedule(
            UUID adminId,
            UUID appointmentId,
            RescheduleAppointmentRequest request
    ) {
        AppUser admin = getUser(adminId);
        Appointment appointment = getAppointment(appointmentId);
        validateAdminTimes(request.startTime(), request.endTime());

        SalonSetting settings = availabilityService.getSettings();
        ZoneId zone = ZoneId.of(settings.getTimezone());
        Instant startAt = request.date().atTime(request.startTime()).atZone(zone).toInstant();
        Instant endAt = request.date().atTime(request.endTime()).atZone(zone).toInstant();
        if (!startAt.isAfter(clock.instant())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Appointment must start in the future.");
        }

        scheduleLockService.lockDate(request.date());
        if (availabilityService.hasConflictExcludingAppointment(appointmentId, startAt, endAt)) {
            throw slotConflict();
        }

        Instant now = clock.instant();
        try {
            appointment.reschedule(startAt, endAt, now);
            appointmentRepository.saveAndFlush(appointment);
        } catch (IllegalStateException exception) {
            throw new ApiException(HttpStatus.CONFLICT, exception.getMessage());
        } catch (DataIntegrityViolationException exception) {
            throw slotConflict();
        }

        Map<String, Object> payload = eventPayload(appointment);
        payload.put("updatedBy", admin.getId().toString());
        outboxEventRepository.save(new OutboxEvent(
                appointment.getId(),
                "AppointmentRescheduledV1",
                payload,
                now
        ));
        notificationService.notifyClient(
                appointment.getCustomer(),
                "APPOINTMENT_RESCHEDULED",
                "Appointment time updated",
                "Kuri updated the time for your " + appointment.getServiceNameSnapshot() + " appointment.",
                appointment.getId()
        );
        return AdminAppointmentResponse.from(appointment);
    }

    @Transactional(readOnly = true)
    public AdminScheduleAvailabilityResponse getRescheduleAvailability(UUID appointmentId, LocalDate date) {
        Appointment appointment = getAppointment(appointmentId);
        if (appointment.getStatus() != AppointmentStatus.PENDING_CONFIRMATION &&
                appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new ApiException(HttpStatus.CONFLICT, "Only pending or confirmed appointments can be rescheduled.");
        }
        return availabilityService.getAdminScheduleAvailability(
                appointmentId,
                date,
                appointment.getDurationMinutesSnapshot()
        );
    }

    @Transactional
    public AppointmentResponse requestCancellation(UUID userId, UUID appointmentId, String reason) {
        AppUser user = getUser(userId);
        Appointment appointment = getAppointment(appointmentId);
        if (!appointment.getCustomer().getId().equals(getClientForUser(user).getId())) {
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
        notificationService.notifyAdmins("CANCELLATION_REQUEST", "Cancellation requested",
                "A client asked to cancel " + appointment.getServiceNameSnapshot() + ".", appointment.getId());
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
        notificationService.notifyClient(appointment.getCustomer(), "APPOINTMENT_CANCELLED", "Cancellation approved",
                "Your appointment has been cancelled.", appointment.getId());
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
        notificationService.notifyClient(appointment.getCustomer(), "CANCELLATION_REJECTED", "Cancellation request updated",
                "Your cancellation request was not approved. Please contact Kuri if you need help.", appointment.getId());
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
        notificationService.notifyClient(appointment.getCustomer(), "APPOINTMENT_CONFIRMED", "Appointment confirmed",
                "Your " + appointment.getServiceNameSnapshot() + " appointment is confirmed.", appointment.getId());
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
        notificationService.notifyClient(appointment.getCustomer(), "APPOINTMENT_REJECTED", "Booking request declined",
                "Your booking request could not be confirmed. Please choose another time.", appointment.getId());
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse cancelByAdmin(UUID adminId, UUID appointmentId, String reason) {
        AppUser admin = getUser(adminId);
        Appointment appointment = getAppointment(appointmentId);
        AppointmentStatus previous = appointment.getStatus();
        Instant now = clock.instant();
        try {
            appointment.cancelByAdmin(now);
        } catch (IllegalStateException exception) {
            throw new ApiException(HttpStatus.CONFLICT, exception.getMessage());
        }
        recordTransition(appointment, previous, reason, admin, now, "AppointmentCancelledByAdminV1");
        notificationService.notifyClient(
                appointment.getCustomer(),
                "APPOINTMENT_CANCELLED",
                "Appointment cancelled",
                "Your " + appointment.getServiceNameSnapshot() + " appointment has been cancelled. Please contact Kuri if you need help.",
                appointment.getId()
        );
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse complete(UUID adminId, UUID appointmentId, String reason) {
        AppUser admin = getUser(adminId);
        Appointment appointment = getAppointment(appointmentId);
        if (appointment.getEndAt().isAfter(clock.instant())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "An appointment can only be completed after it ends.");
        }
        AppointmentStatus previous = appointment.getStatus();
        Instant now = clock.instant();
        try {
            appointment.complete(now);
        } catch (IllegalStateException exception) {
            throw new ApiException(HttpStatus.CONFLICT, exception.getMessage());
        }
        recordTransition(appointment, previous, reason, admin, now, "AppointmentCompletedV1");
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse markNoShow(UUID adminId, UUID appointmentId, String reason) {
        AppUser admin = getUser(adminId);
        Appointment appointment = getAppointment(appointmentId);
        if (appointment.getStartAt().isAfter(clock.instant())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A future appointment cannot be marked no-show.");
        }
        AppointmentStatus previous = appointment.getStatus();
        Instant now = clock.instant();
        try {
            appointment.markNoShow(now);
        } catch (IllegalStateException exception) {
            throw new ApiException(HttpStatus.CONFLICT, exception.getMessage());
        }
        recordTransition(appointment, previous, reason, admin, now, "AppointmentNoShowRecordedV1");
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

    private void validateAdminTimes(LocalTime start, LocalTime end) {
        if (!end.isAfter(start)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "End time must be after start time on the same date.");
        }
        if (start.getSecond() != 0 || end.getSecond() != 0 ||
                start.getNano() != 0 || end.getNano() != 0 ||
                start.getMinute() % ADMIN_TIME_INCREMENT_MINUTES != 0 ||
                end.getMinute() % ADMIN_TIME_INCREMENT_MINUTES != 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Admin appointment times must use 5-minute increments.");
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

    private Client getClientForUser(AppUser user) {
        if (user.getClient() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "A client account is required.");
        }
        return clientRepository.findById(user.getClient().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Client record is missing."));
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
        payload.put("estimatedPrice", appointment.getEstimatedPrice());
        payload.put("finalPrice", appointment.getFinalPrice());
        return payload;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

