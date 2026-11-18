package com.kurilabo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kurilabo.auth.domain.AppUser;
import com.kurilabo.auth.domain.UserRole;
import com.kurilabo.auth.infrastructure.AppUserRepository;
import com.kurilabo.user.domain.UserProfile;
import com.kurilabo.user.infrastructure.UserProfileRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "kuri.media.root=target/test-media")
@AutoConfigureMockMvc
@Transactional
class KuriLaboEndToEndFlowTests {

    @Autowired MockMvc mvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    @Autowired AppUserRepository userRepository;
    @Autowired UserProfileRepository profileRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private String adminPhone;
    private String suffix;

    @BeforeEach
    void createAdmin() {
        suffix = UUID.randomUUID().toString().substring(0, 8);
        adminPhone = "+1604" + String.format("%07d", Math.abs(suffix.hashCode()) % 10_000_000);
        UUID adminId = UUID.randomUUID();
        userRepository.save(new AppUser(adminId, null, passwordEncoder.encode("admin123"), UserRole.ADMIN));
        profileRepository.save(new UserProfile(adminId, "E2E Admin " + suffix, adminPhone, null));
    }

    @AfterEach
    void removeTestMedia() throws Exception {
        Path root = Path.of("target/test-media");
        if (!Files.exists(root)) return;
        try (var paths = Files.walk(root)) {
            paths.sorted(Comparator.reverseOrder()).forEach(path -> {
                try { Files.deleteIfExists(path); } catch (Exception ignored) { }
            });
        }
    }

    @Test
    void completeAdminAndClientJourney() throws Exception {
        String adminToken = login(adminPhone, "admin123");

        String guestName = "E2E Guest " + suffix;
        JsonNode guest = json(postJson("/api/v1/admin/users/guests", adminToken, Map.of("name", guestName, "phone", ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").isEmpty())
                .andReturn().getResponse().getContentAsString());
        String guestId = guest.get("id").asText();

        postJson("/api/v1/admin/users/guests", adminToken, Map.of("name", guestName.toLowerCase(), "phone", ""))
                .andExpect(status().isConflict());

        String clientName = "E2E Client " + suffix;
        String clientPhone = "+1778" + String.format("%07d", Math.abs((suffix + "client").hashCode()) % 10_000_000);
        JsonNode registration = json(postJson("/api/v1/auth/register", null, Map.of(
                "email", "e2e-" + suffix + "@kuri.test",
                "password", "client123",
                "name", clientName,
                "phone", clientPhone,
                "birthday", "1995-05-12",
                "clientType", "MOBILE",
                "deviceName", "E2E test"
        )).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        String clientToken = registration.get("accessToken").asText();
        String clientId = registration.path("user").path("id").asText();

        JsonNode services = json(mvc.perform(get("/api/v1/services").header("Authorization", bearer(clientToken)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        String basicServiceId = services.get(0).get("id").asText();

        LocalDate bookingDate = LocalDate.now().plusDays(180);
        JsonNode requested = json(postJson("/api/v1/appointments", clientToken, Map.of(
                "serviceId", basicServiceId,
                "date", bookingDate.toString(),
                "startTime", "09:00",
                "note", "E2E booking note"
        )).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_CONFIRMATION"))
                .andReturn().getResponse().getContentAsString());
        String appointmentId = requested.get("id").asText();

        postJson("/api/v1/admin/appointments/" + appointmentId + "/confirm", adminToken, Map.of("reason", "E2E confirmed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        postJson("/api/v1/admin/availability-blocks", adminToken, Map.of(
                "date", bookingDate.toString(),
                "fullDay", false,
                "startTime", "14:00",
                "endTime", "14:30",
                "reason", "E2E blocked time"
        )).andExpect(status().isOk());

        mvc.perform(get("/api/v1/availability")
                        .param("date", bookingDate.toString())
                        .param("serviceId", basicServiceId)
                        .header("Authorization", bearer(clientToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slots[?(@.startTime == '09:00:00')].available", hasItem(false)));

        LocalDate adminBookingDate = bookingDate.plusDays(1);
        JsonNode guestAppointment = json(postJson("/api/v1/admin/appointments", adminToken, Map.of(
                "customerId", guestId,
                "serviceId", basicServiceId,
                "customServiceName", "",
                "date", adminBookingDate.toString(),
                "startTime", "10:00",
                "endTime", "11:00",
                "note", "E2E admin-created appointment"
        )).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andReturn().getResponse().getContentAsString());
        String guestAppointmentId = guestAppointment.get("id").asText();

        MockMultipartFile guestImage = new MockMultipartFile("files", "guest.png", "image/png", new byte[] {5, 6, 7});
        mvc.perform(multipart("/api/v1/admin/nail-sets")
                        .file(guestImage).param("appointmentId", guestAppointmentId).param("title", "Guest history set")
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.clientId").value(guestId));

        postJson("/api/v1/admin/users/" + guestId + "/merge", adminToken, Map.of("targetUserId", clientId))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(clientId));
        mvc.perform(get("/api/v1/admin/users/" + guestId).header("Authorization", bearer(adminToken)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/appointments/me").header("Authorization", bearer(clientToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '" + guestAppointmentId + "')].customerId", hasItem(clientId)));
        mvc.perform(get("/api/v1/nail-sets/mine").header("Authorization", bearer(clientToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.appointmentId == '" + guestAppointmentId + "')].title", hasItem("Guest history set")));

        JsonNode pastVisit = json(postJson("/api/v1/admin/appointments/history", adminToken, Map.of(
                "customerId", clientId,
                "serviceId", basicServiceId,
                "customServiceName", "",
                "date", LocalDate.now().minusDays(2).toString(),
                "startTime", "10:00",
                "endTime", "12:00",
                "finalPrice", 120.00,
                "serviceNotes", "E2E initial notes"
        )).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andReturn().getResponse().getContentAsString());
        String pastVisitId = pastVisit.get("id").asText();

        putJson("/api/v1/admin/appointments/" + pastVisitId + "/visit-details", adminToken, Map.of(
                "finalPrice", 145.50,
                "serviceNotes", "E2E updated products and technique"
        )).andExpect(status().isOk())
                .andExpect(jsonPath("$.finalPrice").value(145.50))
                .andExpect(jsonPath("$.serviceNotes").value("E2E updated products and technique"));

        MockMultipartFile image = new MockMultipartFile("files", "e2e.png", "image/png", new byte[] {1, 2, 3, 4});
        mvc.perform(multipart("/api/v1/admin/nail-sets")
                        .file(image)
                        .param("appointmentId", pastVisitId)
                        .param("title", "E2E nail set")
                        .param("description", "E2E linked gallery")
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clientId").value(clientId))
                .andExpect(jsonPath("$.appointmentId").value(pastVisitId))
                .andExpect(jsonPath("$.images.length()").value(1));

        mvc.perform(get("/api/v1/appointments/me").header("Authorization", bearer(clientToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '" + pastVisitId + "')].status", hasItem("COMPLETED")));
        mvc.perform(get("/api/v1/nail-sets/mine").header("Authorization", bearer(clientToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.appointmentId == '" + pastVisitId + "')].title", hasItem("E2E nail set")));
        mvc.perform(get("/api/v1/inspiration").header("Authorization", bearer(clientToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.title == 'E2E nail set')].images.length()", hasItem(1)));

        mvc.perform(get("/api/v1/notifications").header("Authorization", bearer(clientToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.type == 'APPOINTMENT_CONFIRMED')].title", hasItem("Appointment confirmed")));
        mvc.perform(get("/api/v1/notifications").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.type == 'BOOKING_REQUEST')].title", hasItem("New booking request")));

        postJson("/api/v1/appointments/" + appointmentId + "/cancellation-requests", clientToken, Map.of("reason", "E2E change of plans"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLATION_REQUESTED"));

        mvc.perform(get("/api/v1/notifications").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.type == 'CANCELLATION_REQUEST')].title", hasItem("Cancellation requested")));

        putJson("/api/v1/users/me", clientToken, Map.of(
                "name", clientName + " Updated",
                "phone", clientPhone,
                "birthday", "1995-05-12",
                "instagram", "@e2e",
                "wechat", "e2e-wechat",
                "preferredNailStyle", "soft chrome",
                "allergyNotes", "none"
        )).andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(clientName + " Updated"))
                .andExpect(jsonPath("$.preferredNailStyle").value("soft chrome"));

        putJson("/api/v1/users/me/password", clientToken, Map.of(
                "currentPassword", "client123", "newPassword", "client456"
        )).andExpect(status().isNoContent());
        login(clientPhone, "client456");

        postJson("/api/v1/admin/users/" + clientId + "/password-reset", adminToken, Map.of("newPassword", "temporary789"))
                .andExpect(status().isNoContent());
        login(clientPhone, "temporary789");
    }

    private String login(String phone, String password) throws Exception {
        String body = postJson("/api/v1/auth/login", null, Map.of(
                "phone", phone,
                "password", password,
                "clientType", "MOBILE",
                "deviceName", "E2E test"
        )).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json(body).get("accessToken").asText();
    }

    private org.springframework.test.web.servlet.ResultActions postJson(String path, String token, Object body) throws Exception {
        var request = post(path).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsBytes(body));
        if (token != null) request.header("Authorization", bearer(token));
        return mvc.perform(request);
    }

    private org.springframework.test.web.servlet.ResultActions putJson(String path, String token, Object body) throws Exception {
        return mvc.perform(put(path)
                .header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(body)));
    }

    private JsonNode json(String value) throws Exception {
        return objectMapper.readTree(value);
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
