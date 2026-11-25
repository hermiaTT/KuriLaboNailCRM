package com.kurilabo.user.infrastructure;

import com.kurilabo.user.domain.AdminProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AdminProfileRepository extends JpaRepository<AdminProfile, UUID> {
}
