package com.kurilabo.appointment.infrastructure;

import com.kurilabo.appointment.domain.AppointmentStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AppointmentStatusHistoryRepository extends JpaRepository<AppointmentStatusHistory, UUID> {
}

