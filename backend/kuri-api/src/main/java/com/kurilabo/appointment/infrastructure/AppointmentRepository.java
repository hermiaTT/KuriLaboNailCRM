package com.kurilabo.appointment.infrastructure;

import com.kurilabo.appointment.domain.Appointment;
import com.kurilabo.appointment.domain.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    List<Appointment> findByCustomer_IdOrderByStartAtDesc(UUID customerId);

    List<Appointment> findAllByOrderByStartAtDesc();
}

