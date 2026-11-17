package com.kurilabo.appointment.infrastructure;

import com.kurilabo.appointment.domain.CancellationRequest;
import com.kurilabo.appointment.domain.CancellationRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CancellationRequestRepository extends JpaRepository<CancellationRequest, UUID> {

    Optional<CancellationRequest> findByAppointment_IdAndStatus(
            UUID appointmentId,
            CancellationRequestStatus status
    );
}

