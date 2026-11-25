package com.kurilabo.auth.infrastructure;

import com.kurilabo.auth.domain.AppUser;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.kurilabo.auth.domain.UserRole;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

    Optional<AppUser> findByEmailIgnoreCase(String email);
    @EntityGraph(attributePaths = "client")
    Optional<AppUser> findByLoginPhone(String loginPhone);
    Optional<AppUser> findByClient_Id(UUID clientId);
    List<AppUser> findAllByClient_IdIn(List<UUID> clientIds);

    boolean existsByEmailIgnoreCase(String email);
    boolean existsByLoginPhone(String loginPhone);
    boolean existsByLoginPhoneAndIdNot(String loginPhone, UUID id);

    List<AppUser> findByRoleOrderByCreatedAtDesc(UserRole role);
    List<AppUser> findByRole(UserRole role);
}

