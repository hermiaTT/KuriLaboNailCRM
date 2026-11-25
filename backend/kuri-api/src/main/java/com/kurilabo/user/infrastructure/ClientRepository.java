package com.kurilabo.user.infrastructure;

import com.kurilabo.user.domain.Client;
import com.kurilabo.user.domain.ClientStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientRepository extends JpaRepository<Client, UUID> {
    Optional<Client> findByContactPhoneAndStatus(String phone, ClientStatus status);
    boolean existsByContactPhoneAndStatus(String phone, ClientStatus status);
    boolean existsByContactPhoneAndStatusAndIdNot(String phone, ClientStatus status, UUID id);
    boolean existsByAdminDisplayNameIgnoreCaseAndStatus(String name, ClientStatus status);
    boolean existsByAdminDisplayNameIgnoreCaseAndStatusAndIdNot(String name, ClientStatus status, UUID id);
    List<Client> findAllByStatusOrderByCreatedAtDesc(ClientStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select client from Client client where client.contactPhone = :phone and client.status = :status")
    Optional<Client> findLockedByContactPhoneAndStatus(@Param("phone") String phone, @Param("status") ClientStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select client from Client client where client.id = :id")
    Optional<Client> findLockedById(@Param("id") UUID id);
}
