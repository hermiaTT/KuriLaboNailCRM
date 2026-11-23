package com.kurilabo.servicecatalog.api;

import com.kurilabo.servicecatalog.domain.ServiceDefinition;

import java.util.UUID;
import java.math.BigDecimal;

public record AdminServiceDefinitionResponse(
        UUID id,
        String code,
        String name,
        String description,
        int durationMinutes,
        BigDecimal price,
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
                service.getPrice(),
                service.isActive(),
                service.getDisplayOrder()
        );
    }
}
