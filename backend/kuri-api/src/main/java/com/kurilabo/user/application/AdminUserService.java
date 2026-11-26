package com.kurilabo.user.application;

import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.domain.UserRole;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.appointment.domain.AppointmentStatus;
import com.kurilabo.appointment.infrastructure.AppointmentRepository;
import com.kurilabo.outbox.domain.OutboxEvent;
import com.kurilabo.outbox.infrastructure.OutboxEventRepository;
import com.kurilabo.shared.error.ApiException;
import com.kurilabo.shared.phone.PhoneNumberNormalizer;
import com.kurilabo.user.api.AdminUpdateUserRequest;
import com.kurilabo.user.api.AdminUserDetailResponse;
import com.kurilabo.user.api.AdminUserSummaryResponse;
import com.kurilabo.user.api.CreateGuestClientRequest;
import com.kurilabo.user.api.MergeGuestClientRequest;
import com.kurilabo.user.domain.Client;
import com.kurilabo.user.domain.ClientStatus;
import com.kurilabo.user.infrastructure.ClientRepository;
import jakarta.persistence.EntityManager;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AdminUserService {
    private final AppUserRepository users;
    private final ClientRepository clients;
    private final AppointmentRepository appointments;
    private final Clock clock;
    private final OutboxEventRepository outbox;
    private final JdbcTemplate jdbc;
    private final EntityManager entityManager;

    public AdminUserService(AppUserRepository users, ClientRepository clients, AppointmentRepository appointments, Clock clock,
                            OutboxEventRepository outbox, JdbcTemplate jdbc, EntityManager entityManager) {
        this.users = users; this.clients = clients; this.appointments = appointments; this.clock = clock; this.outbox = outbox;
        this.jdbc = jdbc; this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public List<AdminUserSummaryResponse> getAll() {
        List<Client> activeClients = clients.findAllByStatusOrderByCreatedAtDesc(ClientStatus.ACTIVE);
        if (activeClients.isEmpty()) return List.of();
        Map<UUID, java.time.Instant> nextAppointments = appointments.findNextAppointments(
                        activeClients.stream().map(Client::getId).toList(),
                        clock.instant(),
                        Set.of(AppointmentStatus.PENDING_CONFIRMATION, AppointmentStatus.CONFIRMED,
                                AppointmentStatus.CANCELLATION_REQUESTED)
                ).stream()
                .collect(Collectors.toMap(AppointmentRepository.NextAppointment::getClientId,
                        AppointmentRepository.NextAppointment::getStartAt));
        Map<UUID, AppUser> accounts = users.findAllByClient_IdIn(activeClients.stream().map(Client::getId).toList())
                .stream().collect(Collectors.toMap(user -> user.getClient().getId(), Function.identity()));
        return activeClients.stream()
                .map(client -> AdminUserSummaryResponse.from(client, accounts.get(client.getId()),
                        nextAppointments.get(client.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminUserDetailResponse get(UUID clientId) {
        Client client = getClient(clientId);
        return AdminUserDetailResponse.from(client, users.findByClient_Id(clientId).orElse(null));
    }

    @Transactional
    public AdminUserDetailResponse createGuest(UUID actingAdminId, CreateGuestClientRequest request) {
        AppUser admin = getAdmin(actingAdminId);
        String internalName = request.name().trim();
        if (clients.existsByAdminDisplayNameIgnoreCaseAndStatus(internalName, ClientStatus.ACTIVE)) {
            throw new ApiException(HttpStatus.CONFLICT, "This internal client name already exists.");
        }
        String phone = normalizeOptionalPhone(request.phone());
        if (phone != null && clients.existsByContactPhoneAndStatus(phone, ClientStatus.ACTIVE)) {
            throw new ApiException(HttpStatus.CONFLICT, "This contact phone already belongs to another client record.");
        }
        Client client = clients.save(new Client(UUID.randomUUID(), null, internalName, phone, null, clock.instant()));
        outbox.save(new OutboxEvent("Client", client.getId(), "GuestClientCreatedV2",
                Map.of("clientId", client.getId().toString(), "createdBy", admin.getId().toString()), clock.instant()));
        return AdminUserDetailResponse.from(client, null);
    }

    @Transactional
    public AdminUserDetailResponse update(UUID actingAdminId, UUID clientId, AdminUpdateUserRequest request) {
        getAdmin(actingAdminId);
        Client client = getClient(clientId);
        String internalName = request.name().trim();
        if (clients.existsByAdminDisplayNameIgnoreCaseAndStatusAndIdNot(internalName, ClientStatus.ACTIVE, clientId)) {
            throw new ApiException(HttpStatus.CONFLICT, "This internal client name already exists.");
        }
        String phone = normalizeOptionalPhone(request.phone());
        AppUser account = users.findByClient_Id(clientId).orElse(null);
        if (account != null && !Objects.equals(phone, client.getContactPhone())) {
            throw new ApiException(HttpStatus.CONFLICT, "Registered client phone cannot be changed by admin.");
        }
        if (phone != null && clients.existsByContactPhoneAndStatusAndIdNot(phone, ClientStatus.ACTIVE, clientId)) {
            throw new ApiException(HttpStatus.CONFLICT, "This contact phone already belongs to another client record.");
        }
        client.updateByAdmin(internalName, phone, request.birthday(), optional(request.instagram()),
                optional(request.wechat()), optional(request.preferredNailStyle()), optional(request.allergyNotes()),
                optional(request.adminNotes()), clock.instant());
        return AdminUserDetailResponse.from(client, account);
    }

    @Transactional
    public void archiveGuest(UUID actingAdminId, UUID clientId) {
        AppUser admin = getAdmin(actingAdminId);
        Client client = clients.findLockedById(clientId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Client was not found."));
        if (client.getStatus() != ClientStatus.ACTIVE) {
            throw new ApiException(HttpStatus.CONFLICT, "Only active client records can be archived.");
        }
        if (users.findByClient_Id(clientId).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Registered clients cannot be deleted.");
        }
        client.archive(clock.instant());
        outbox.save(new OutboxEvent("Client", clientId, "GuestClientArchivedV1",
                Map.of("clientId", clientId.toString(), "archivedBy", admin.getId().toString()), clock.instant()));
    }

    @Transactional
    public AdminUserDetailResponse mergeGuest(UUID actingAdminId, UUID sourceClientId, MergeGuestClientRequest request) {
        AppUser admin = getAdmin(actingAdminId);
        UUID targetClientId = request.targetClientId();
        if (sourceClientId.equals(targetClientId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose two different client records.");
        }
        Client source = clients.findLockedById(sourceClientId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Source client was not found."));
        Client target = clients.findLockedById(targetClientId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Target client was not found."));
        if (source.getStatus() != ClientStatus.ACTIVE || target.getStatus() != ClientStatus.ACTIVE) {
            throw new ApiException(HttpStatus.CONFLICT, "Only active client records can be merged.");
        }
        if (users.findByClient_Id(sourceClientId).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "The source client already has a login account. Choose the unregistered duplicate as the source.");
        }
        AppUser targetAccount = users.findByClient_Id(targetClientId)
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "The merge target must be linked to a registered account."));

        var now = clock.instant();
        source.markMergedInto(target, admin, now);
        entityManager.flush();
        target.mergeMissingDetailsFrom(source, now);
        entityManager.flush();

        jdbc.update("update appointment set customer_id = ? where customer_id = ?", targetClientId, sourceClientId);
        jdbc.update("update nail_set set client_id = ? where client_id = ?", targetClientId, sourceClientId);
        jdbc.update("update collection_item set customer_id = ? where customer_id = ?", targetClientId, sourceClientId);
        jdbc.update("update notification set client_id = ? where client_id = ?", targetClientId, sourceClientId);
        mergeFavorites("nail_set_favorite", "nail_set_id", targetClientId, sourceClientId);
        mergeFavorites("inspiration_favorite", "inspiration_item_id", targetClientId, sourceClientId);
        jdbc.update("insert into client_merge_history(id, source_client_id, target_client_id, merged_by, merged_at) values (?, ?, ?, ?, ?)",
                UUID.randomUUID(), sourceClientId, targetClientId, admin.getId(), java.sql.Timestamp.from(now));
        outbox.save(new OutboxEvent("Client", targetClientId, "ClientMergedV2",
                Map.of("sourceClientId", sourceClientId.toString(), "targetClientId", targetClientId.toString(),
                        "mergedBy", admin.getId().toString()), now));
        entityManager.flush();
        entityManager.clear();
        Client mergedTarget = getClient(targetClientId);
        return AdminUserDetailResponse.from(mergedTarget, users.findByClient_Id(targetClientId).orElse(targetAccount));
    }

    private void mergeFavorites(String table, String itemColumn, UUID target, UUID source) {
        jdbc.update("insert into " + table + "(client_id, " + itemColumn + ", created_at) select ?, " + itemColumn +
                ", created_at from " + table + " where client_id = ? on conflict do nothing", target, source);
        jdbc.update("delete from " + table + " where client_id = ?", source);
    }
    private AppUser getAdmin(UUID id) {
        AppUser user = users.findById(id).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Administrator no longer exists."));
        if (user.getRole() != UserRole.ADMIN) throw new ApiException(HttpStatus.FORBIDDEN, "Administrator access is required.");
        return user;
    }
    private Client getClient(UUID id) { return clients.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Client was not found.")); }
    private static String optional(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private static String normalizeOptionalPhone(String value) {
        if (value == null || value.isBlank()) return null;
        try { return PhoneNumberNormalizer.normalize(value); }
        catch (IllegalArgumentException exception) { throw new ApiException(HttpStatus.BAD_REQUEST, exception.getMessage()); }
    }
}
