package com.kurilabo.servicecatalog.api;

import com.kurilabo.servicecatalog.domain.ServiceDefinition;

import java.util.UUID;
import java.math.BigDecimal;

public record ServiceDefinitionResponse(
        UUID id,
        String code,
        String name,
        String description,
        int durationMinutes,
        BigDecimal price
) {
    public static ServiceDefinitionResponse from(ServiceDefinition service) {
        return new ServiceDefinitionResponse(
                service.getId(),
                service.getCode(),
                service.getName(),
                service.getDescription(),
                service.getDurationMinutes(),
                service.getPrice()
        );
    }
}

