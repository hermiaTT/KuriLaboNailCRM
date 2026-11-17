package com.kurilabo.servicecatalog.api;

import com.kurilabo.servicecatalog.domain.ServiceDefinition;

import java.util.UUID;

public record AdminServiceDefinitionResponse(
        UUID id,
        String code,
        String name,
        String description,
        int durationMinutes,
        boolean active,
        int displayOrder
) {
    public static AdminServiceDefinitionResponse from(ServiceDefinition service) {
        return new AdminServiceDefinitionResponse(
                service.getId(),
                service.getCode(),
                service.getName(),
                service.getDescription(),
                service.getDurationMinutes(),
                service.isActive(),
                service.getDisplayOrder()
        );
    }
}
