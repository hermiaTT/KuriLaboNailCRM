package com.kurilabo.servicecatalog.application;

import com.kurilabo.servicecatalog.api.AdminServiceDefinitionRequest;
import com.kurilabo.servicecatalog.api.AdminServiceDefinitionResponse;
import com.kurilabo.servicecatalog.api.ServiceDefinitionResponse;
import com.kurilabo.servicecatalog.domain.ServiceDefinition;
import com.kurilabo.servicecatalog.infrastructure.ServiceDefinitionRepository;
import com.kurilabo.shared.error.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class ServiceCatalogService {

    private final ServiceDefinitionRepository repository;
    private final Clock clock;

    public ServiceCatalogService(ServiceDefinitionRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<ServiceDefinitionResponse> getActiveServices() {
        return repository.findByActiveTrueOrderByDisplayOrderAsc().stream()
                .map(ServiceDefinitionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminServiceDefinitionResponse> getAllServices() {
        return repository.findAllByOrderByDisplayOrderAsc().stream()
                .map(AdminServiceDefinitionResponse::from)
                .toList();
    }

    @Transactional
    public AdminServiceDefinitionResponse create(AdminServiceDefinitionRequest request) {
        validateDuration(request.durationMinutes());
        String code = normalizeCode(request.code());
        if (repository.existsByCodeIgnoreCase(code)) {
            throw new ApiException(HttpStatus.CONFLICT, "A service with this code already exists");
        }

        ServiceDefinition service = new ServiceDefinition(
                UUID.randomUUID(),
                code,
                request.name().trim(),
                normalizeOptional(request.description()),
                request.durationMinutes(),
                request.active(),
                request.displayOrder(),
                clock.instant()
        );
        return AdminServiceDefinitionResponse.from(repository.save(service));
    }

    @Transactional
    public AdminServiceDefinitionResponse update(UUID serviceId, AdminServiceDefinitionRequest request) {
        validateDuration(request.durationMinutes());
        String code = normalizeCode(request.code());
        if (repository.existsByCodeIgnoreCaseAndIdNot(code, serviceId)) {
            throw new ApiException(HttpStatus.CONFLICT, "A service with this code already exists");
        }

        ServiceDefinition service = getRequired(serviceId);
        service.update(
                code,
                request.name().trim(),
                normalizeOptional(request.description()),
                request.durationMinutes(),
                request.active(),
                request.displayOrder(),
                clock.instant()
        );
        return AdminServiceDefinitionResponse.from(service);
    }

    @Transactional
    public void deactivate(UUID serviceId) {
        ServiceDefinition service = getRequired(serviceId);
        service.deactivate(clock.instant());
    }

    private ServiceDefinition getRequired(UUID serviceId) {
        return repository.findById(serviceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Service not found"));
    }

    private void validateDuration(int durationMinutes) {
        if (durationMinutes % 30 != 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Service duration must use 30-minute increments");
        }
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}

