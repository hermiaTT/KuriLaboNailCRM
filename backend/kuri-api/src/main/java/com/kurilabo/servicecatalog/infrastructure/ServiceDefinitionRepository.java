package com.kurilabo.servicecatalog.infrastructure;

import com.kurilabo.servicecatalog.domain.ServiceDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ServiceDefinitionRepository extends JpaRepository<ServiceDefinition, UUID> {

    List<ServiceDefinition> findByActiveTrueOrderByDisplayOrderAsc();

    List<ServiceDefinition> findAllByOrderByDisplayOrderAsc();

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, UUID id);
}

