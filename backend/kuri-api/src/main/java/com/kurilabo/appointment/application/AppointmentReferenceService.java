package com.kurilabo.appointment.application;

import com.kurilabo.appointment.api.AppointmentResponse;
import com.kurilabo.appointment.domain.Appointment;
import com.kurilabo.appointment.domain.AppointmentStatus;
import com.kurilabo.appointment.infrastructure.AppointmentRepository;
import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.portfolio.application.LocalMediaStorage;
import com.kurilabo.portfolio.domain.MediaAsset;
import com.kurilabo.portfolio.infrastructure.MediaAssetRepository;
import com.kurilabo.shared.error.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AppointmentReferenceService {
    private static final int MAX_IMAGES = 6;
    private final AppointmentRepository appointmentRepository;
    private final AppUserRepository userRepository;
    private final MediaAssetRepository mediaAssetRepository;
    private final LocalMediaStorage storage;
    private final Clock clock;

    public AppointmentReferenceService(AppointmentRepository appointmentRepository, AppUserRepository userRepository,
                                       MediaAssetRepository mediaAssetRepository, LocalMediaStorage storage, Clock clock) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.mediaAssetRepository = mediaAssetRepository;
        this.storage = storage;
        this.clock = clock;
    }

    @Transactional
    public AppointmentResponse upload(UUID userId, UUID appointmentId, List<MultipartFile> files) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Appointment was not found."));
        if (!appointment.getCustomer().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You cannot update this appointment.");
        }
        if (appointment.getStatus() != AppointmentStatus.PENDING_CONFIRMATION) {
            throw new ApiException(HttpStatus.CONFLICT, "Reference photos can only be added while the appointment is pending.");
        }
        if (files == null || files.isEmpty() || appointment.getReferenceMedia().size() + files.size() > MAX_IMAGES) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose 1 to 6 reference photos.");
        }
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User no longer exists."));
        List<String> storedKeys = new ArrayList<>();
        try {
            int order = appointment.getReferenceMedia().size();
            for (MultipartFile file : files) {
                LocalMediaStorage.StoredImage stored = storage.store(file);
                storedKeys.add(stored.objectKey());
                MediaAsset asset = mediaAssetRepository.save(new MediaAsset(UUID.randomUUID(), stored.objectKey(),
                        stored.originalFilename(), stored.contentType(), stored.sizeBytes(), user, clock.instant()));
                appointment.addReferenceMedia(asset, order++);
            }
            appointmentRepository.saveAndFlush(appointment);
            return AppointmentResponse.from(appointment);
        } catch (RuntimeException exception) {
            storedKeys.forEach(storage::delete);
            throw exception;
        }
    }
}
