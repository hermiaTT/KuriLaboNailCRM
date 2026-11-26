package com.kurilabo.appointment.infrastructure;

import com.kurilabo.appointment.domain.Appointment;
import com.kurilabo.appointment.domain.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.EntityGraph;

import java.time.Instant;
import java.util.Collection;
import java.util.UUID;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    @Query("""
            select (count(a) > 0) from Appointment a
            where a.status in :statuses
              and a.startAt < :endAt
              and a.endAt > :startAt
            """)
    boolean existsOverlapping(
            @Param("startAt") Instant startAt,
            @Param("endAt") Instant endAt,
            @Param("statuses") Collection<AppointmentStatus> statuses
    );

    @Query("""
            select (count(a) > 0) from Appointment a
            where a.id <> :appointmentId
              and a.status in :statuses
              and a.startAt < :endAt
              and a.endAt > :startAt
            """)
    boolean existsOverlappingExcluding(
            @Param("appointmentId") UUID appointmentId,
            @Param("startAt") Instant startAt,
            @Param("endAt") Instant endAt,
            @Param("statuses") Collection<AppointmentStatus> statuses
    );

    @EntityGraph(attributePaths = {"customer"})
    @Query("""
            select a from Appointment a
            where a.id <> :appointmentId
              and a.status in :statuses
              and a.startAt < :rangeEnd
              and a.endAt > :rangeStart
            order by a.startAt asc
            """)
    List<Appointment> findOverlappingExcluding(
            @Param("appointmentId") UUID appointmentId,
            @Param("rangeStart") Instant rangeStart,
            @Param("rangeEnd") Instant rangeEnd,
            @Param("statuses") Collection<AppointmentStatus> statuses
    );

    @EntityGraph(attributePaths = {"customer", "serviceDefinition", "referenceMedia", "referenceMedia.mediaAsset"})
    List<Appointment> findByCustomer_IdOrderByStartAtDesc(UUID customerId);

    @EntityGraph(attributePaths = {"customer", "serviceDefinition", "referenceMedia", "referenceMedia.mediaAsset"})
    List<Appointment> findAllByOrderByStartAtDesc();

    @Query("""
            select a.customer.id as clientId, min(a.startAt) as startAt
            from Appointment a
            where a.customer.id in :clientIds
              and a.startAt >= :now
              and a.status in :statuses
            group by a.customer.id
            """)
    List<NextAppointment> findNextAppointments(
            @Param("clientIds") Collection<UUID> clientIds,
            @Param("now") Instant now,
            @Param("statuses") Collection<AppointmentStatus> statuses
    );

    @Override
    @EntityGraph(attributePaths = {"customer", "serviceDefinition", "referenceMedia", "referenceMedia.mediaAsset"})
    java.util.Optional<Appointment> findById(UUID id);

    interface NextAppointment {
        UUID getClientId();
        Instant getStartAt();
    }
}

