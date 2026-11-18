package com.kurilabo.user.infrastructure;

import com.kurilabo.user.domain.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    Optional<UserProfile> findByPhone(String phone);

    boolean existsByPhone(String phone);

    boolean existsByPhoneAndUserIdNot(String phone, UUID userId);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndUserIdNot(String name, UUID userId);
}

