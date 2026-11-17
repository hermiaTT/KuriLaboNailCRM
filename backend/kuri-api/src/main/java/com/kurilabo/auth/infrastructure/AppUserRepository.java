package com.kurilabo.auth.infrastructure;

import com.kurilabo.auth.domain.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import com.kurilabo.auth.domain.UserRole;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<AppUser> findByRoleOrderByCreatedAtDesc(UserRole role);
}

