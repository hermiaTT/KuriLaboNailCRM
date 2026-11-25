package com.kurilabo.portfolio.application;

import com.kurilabo.appointment.domain.Appointment;
import com.kurilabo.appointment.infrastructure.AppointmentRepository;
import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.domain.UserRole;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.user.domain.Client;
import com.kurilabo.user.infrastructure.ClientRepository;
import com.kurilabo.outbox.domain.OutboxEvent;
import com.kurilabo.outbox.infrastructure.OutboxEventRepository;
import com.kurilabo.portfolio.api.NailSetResponse;
import com.kurilabo.portfolio.api.UpdateNailSetRequest;
import com.kurilabo.portfolio.domain.MediaAsset;
import com.kurilabo.portfolio.domain.NailSet;
import com.kurilabo.portfolio.infrastructure.MediaAssetRepository;
import com.kurilabo.portfolio.infrastructure.NailSetRepository;
import com.kurilabo.shared.error.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NailSetService {

    private static final int MAX_IMAGES = 12;

    private final NailSetRepository nailSetRepository;
    private final MediaAssetRepository mediaAssetRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppUserRepository userRepository;
    private final ClientRepository clientRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final LocalMediaStorage storage;
    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;

    public NailSetService(
            NailSetRepository nailSetRepository,
            MediaAssetRepository mediaAssetRepository,
            AppointmentRepository appointmentRepository,
            AppUserRepository userRepository,
            ClientRepository clientRepository,
            OutboxEventRepository outboxEventRepository,
            LocalMediaStorage storage,
            JdbcTemplate jdbcTemplate,
            Clock clock
    ) {
        this.nailSetRepository = nailSetRepository;
        this.mediaAssetRepository = mediaAssetRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.storage = storage;
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    @Transactional
    public NailSetResponse create(
            UUID adminId,
            UUID clientId,
            UUID appointmentId,
            String title,
            String description,
            List<MultipartFile> files
    ) {
        if (files == null || files.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose at least one image.");
        }
        if (files.size() > MAX_IMAGES) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A nail set can contain up to 12 images.");
        }

        AppUser admin = getUser(adminId);
        Appointment appointment = null;
        Client client = clientId == null ? null : getClient(clientId);
        if (appointmentId != null) {
            appointment = appointmentRepository.findById(appointmentId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Appointment was not found."));
            if (nailSetRepository.existsByAppointment_Id(appointmentId)) {
                throw new ApiException(HttpStatus.CONFLICT, "That appointment already has a nail set.");
            }
            if (client != null && !client.getId().equals(appointment.getCustomer().getId())) {
                throw new ApiException(HttpStatus.CONFLICT, "The selected client does not match the appointment.");
            }
            client = appointment.getCustomer();
        }

        Instant now = clock.instant();
        String normalizedTitle = blankToNull(title);
        if (normalizedTitle == null) {
            normalizedTitle = appointment == null ? "Kuri Labo set" : appointment.getServiceNameSnapshot();
        }
        NailSet nailSet = new NailSet(
                UUID.randomUUID(),
                client,
                appointment,
                normalizedTitle,
                blankToNull(description),
                admin,
                now
        );

        List<String> storedKeys = new ArrayList<>();
        try {
            for (int index = 0; index < files.size(); index++) {
                MultipartFile file = files.get(index);
                LocalMediaStorage.StoredImage stored = storage.store(file);
                storedKeys.add(stored.objectKey());
                MediaAsset asset = mediaAssetRepository.save(new MediaAsset(
                        UUID.randomUUID(),
                        stored.objectKey(),
                        stored.originalFilename(),
                        stored.contentType(),
                        stored.sizeBytes(),
                        admin,
                        now
                ));
                nailSet.addMedia(asset, index);
            }
            nailSetRepository.saveAndFlush(nailSet);
            outboxEventRepository.save(new OutboxEvent(
                    "NailSet",
                    nailSet.getId(),
                    "NailSetPublishedV1",
                    eventPayload(nailSet),
                    now
            ));
            return NailSetResponse.from(nailSet, false);
        } catch (RuntimeException exception) {
            storedKeys.forEach(storage::delete);
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public List<NailSetResponse> getInspiration(UUID userId) {
        AppUser user = getUser(userId);
        Set<UUID> favorites = user.getRole() == UserRole.USER && user.getClient() != null
                ? favoriteIds(user.getClient().getId())
                : Set.of();
        return nailSetRepository.findByPublishedTrueOrderByCreatedAtDesc().stream()
                .map(item -> NailSetResponse.from(item, favorites.contains(item.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NailSetResponse> getMine(UUID userId) {
        UUID clientId = clientIdForUser(userId);
        Set<UUID> favorites = favoriteIds(clientId);
        return nailSetRepository.findByClient_IdOrderByCreatedAtDesc(clientId).stream()
                .map(item -> NailSetResponse.from(item, favorites.contains(item.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NailSetResponse> getForClient(UUID clientId) {
        getClient(clientId);
        return nailSetRepository.findByClient_IdOrderByCreatedAtDesc(clientId).stream()
                .map(item -> NailSetResponse.from(item, false))
                .toList();
    }

    @Transactional
    public NailSetResponse update(UUID adminId, UUID nailSetId, UpdateNailSetRequest request) {
        getUser(adminId);
        NailSet nailSet = getNailSet(nailSetId);
        Appointment appointment = null;
        Client client = request.clientId() == null ? null : getClient(request.clientId());
        if (request.appointmentId() != null) {
            appointment = appointmentRepository.findById(request.appointmentId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Appointment was not found."));
            if (nailSetRepository.existsByAppointment_IdAndIdNot(request.appointmentId(), nailSetId)) {
                throw new ApiException(HttpStatus.CONFLICT, "That appointment already has a nail set.");
            }
            if (client != null && !client.getId().equals(appointment.getCustomer().getId())) {
                throw new ApiException(HttpStatus.CONFLICT, "The selected client does not match the appointment.");
            }
            client = appointment.getCustomer();
        }
        Instant now = clock.instant();
        nailSet.updateDetailsAndLink(
                client,
                appointment,
                request.title().trim(),
                blankToNull(request.description()),
                now
        );
        outboxEventRepository.save(new OutboxEvent(
                "NailSet",
                nailSet.getId(),
                "NailSetUpdatedV1",
                eventPayload(nailSet),
                now
        ));
        return NailSetResponse.from(nailSet, false);
    }

    @Transactional
    public NailSetResponse favorite(UUID userId, UUID nailSetId) {
        UUID clientId = clientIdForUser(userId);
        NailSet nailSet = getNailSet(nailSetId);
        jdbcTemplate.update(
                "insert into nail_set_favorite (client_id, nail_set_id) values (?, ?) on conflict do nothing",
                clientId,
                nailSetId
        );
        return NailSetResponse.from(nailSet, true);
    }

    @Transactional
    public NailSetResponse unfavorite(UUID userId, UUID nailSetId) {
        UUID clientId = clientIdForUser(userId);
        NailSet nailSet = getNailSet(nailSetId);
        jdbcTemplate.update(
                "delete from nail_set_favorite where client_id = ? and nail_set_id = ?",
                clientId,
                nailSetId
        );
        return NailSetResponse.from(nailSet, false);
    }

    private NailSet getNailSet(UUID id) {
        return nailSetRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nail set was not found."));
    }

    private Set<UUID> favoriteIds(UUID clientId) {
        return jdbcTemplate.queryForList(
                        "select nail_set_id from nail_set_favorite where client_id = ?",
                        UUID.class,
                        clientId
                ).stream()
                .collect(Collectors.toSet());
    }

    private AppUser getUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User no longer exists."));
    }

    private Client getClient(UUID id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Client was not found."));
    }

    private UUID clientIdForUser(UUID userId) {
        AppUser user = getUser(userId);
        if (user.getRole() != UserRole.USER || user.getClient() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "A client account is required.");
        }
        return user.getClient().getId();
    }

    private Map<String, Object> eventPayload(NailSet nailSet) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("nailSetId", nailSet.getId().toString());
        payload.put("clientId", nailSet.getClient() == null ? null : nailSet.getClient().getId().toString());
        payload.put("appointmentId", nailSet.getAppointment() == null ? null : nailSet.getAppointment().getId().toString());
        payload.put("imageCount", nailSet.getMedia().size());
        payload.put("published", true);
        return payload;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
