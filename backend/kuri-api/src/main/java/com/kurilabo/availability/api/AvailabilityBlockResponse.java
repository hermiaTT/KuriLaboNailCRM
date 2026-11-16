package com.kurilabo.availability.api;

import com.kurilabo.availability.domain.AvailabilityBlock;

import java.time.Instant;
import java.util.UUID;

public record AvailabilityBlockResponse(
        UUID id,
        Instant startAt,
        Instant endAt,
        String reason,
        UUID createdBy
) {
    public static AvailabilityBlockResponse from(AvailabilityBlock block) {
        return new AvailabilityBlockResponse(
                block.getId(),
                block.getStartAt(),
                block.getEndAt(),
                block.getReason(),
                block.getCreatedById()
        );
    }
}

