package com.kurilabo.availability.application;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.availability.api.AvailabilityBlockResponse;
import com.kurilabo.availability.api.CreateAvailabilityBlockRequest;
import com.kurilabo.availability.domain.AvailabilityBlock;
import com.kurilabo.availability.domain.SalonSetting;
import com.kurilabo.availability.infrastructure.AvailabilityBlockRepository;
import com.kurilabo.shared.error.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
public class AvailabilityBlockService {

    private final AvailabilityBlockRepository blockRepository;
    private final AppUserRepository userRepository;
    private final AvailabilityService availabilityService;
    private final ScheduleLockService scheduleLockService;
    private final Clock clock;

    public AvailabilityBlockService(
            AvailabilityBlockRepository blockRepository,
            AppUserRepository userRepository,
            AvailabilityService availabilityService,
            ScheduleLockService scheduleLockService,
            Clock clock
    ) {
        this.blockRepository = blockRepository;
        this.userRepository = userRepository;
        this.availabilityService = availabilityService;
        this.scheduleLockService = scheduleLockService;
        this.clock = clock;
    }

    @Transactional
    public AvailabilityBlockResponse create(UUID adminId, CreateAvailabilityBlockRequest request) {
        AppUser admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User no longer exists."));
        SalonSetting settings = availabilityService.getSettings();
        ZoneId zone = ZoneId.of(settings.getTimezone());
        Instant startAt;
        Instant endAt;

        if (request.fullDay()) {
            startAt = request.date().atStartOfDay(zone).toInstant();
            endAt = request.date().plusDays(1).atStartOfDay(zone).toInstant();
        } else {
            validatePartialTimes(request.startTime(), request.endTime(), settings.getBookingIncrementMinutes());
            startAt = request.date().atTime(request.startTime()).atZone(zone).toInstant();
            endAt = request.date().atTime(request.endTime()).atZone(zone).toInstant();
        }

        scheduleLockService.lockDate(request.date());
        if (availabilityService.hasConflict(startAt, endAt)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "This block overlaps an active appointment or another availability block."
            );
        }

        AvailabilityBlock block = new AvailabilityBlock(
                UUID.randomUUID(),
                startAt,
                endAt,
                blankToNull(request.reason()),
                admin,
                clock.instant()
        );
        return AvailabilityBlockResponse.from(blockRepository.save(block));
    }

    @Transactional(readOnly = true)
    public List<AvailabilityBlockResponse> list(LocalDate from, LocalDate to) {
        if (to.isBefore(from) || to.isAfter(from.plusYears(1))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Availability range must be between 1 day and 1 year.");
        }
        ZoneId zone = ZoneId.of(availabilityService.getSettings().getTimezone());
        Instant rangeStart = from.atStartOfDay(zone).toInstant();
        Instant rangeEnd = to.plusDays(1).atStartOfDay(zone).toInstant();
        return blockRepository
                .findByStartAtLessThanAndEndAtGreaterThanOrderByStartAtAsc(rangeEnd, rangeStart)
                .stream()
                .map(AvailabilityBlockResponse::from)
                .toList();
    }

    @Transactional
    public void delete(UUID blockId) {
        AvailabilityBlock block = blockRepository.findById(blockId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Availability block was not found."));
        ZoneId zone = ZoneId.of(availabilityService.getSettings().getTimezone());
        scheduleLockService.lockDate(block.getStartAt().atZone(zone).toLocalDate());
        blockRepository.delete(block);
    }

    private void validatePartialTimes(LocalTime start, LocalTime end, int incrementMinutes) {
        if (start == null || end == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Start and end time are required for a partial block.");
        }
        if (!end.isAfter(start)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "End time must be after start time on the same date.");
        }
        if (start.getSecond() != 0 || end.getSecond() != 0 ||
                start.getNano() != 0 || end.getNano() != 0 ||
                start.getMinute() % incrementMinutes != 0 ||
                end.getMinute() % incrementMinutes != 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Availability blocks must use 30-minute increments.");
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

